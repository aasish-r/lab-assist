"use strict";
/**
 * Command Service - Processes transcribed speech into structured commands
 * Handles command parsing, context management, and execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandService = void 0;
const AdaptiveNLUService_1 = require("./AdaptiveNLUService");
const app_config_1 = require("../../shared/app-config");
class CommandService {
    constructor(databaseManager) {
        this.currentSessionId = null;
        this.sessionContext = null;
        // Command patterns for parsing
        this.COMMAND_PATTERNS = {
            // Basic recording: "rat 5 cage 3 weight 280 grams"
            RECORD: /(?:rat|mouse)\s+(\d+)\s+cage\s+(\d+)\s+weight\s+(\d+(?:\.\d+)?)\s*(?:grams?|g)?/i,
            // Update weight: "change weight to 300 grams"
            UPDATE_WEIGHT: /(?:change|update|set)\s+weight\s+to\s+(\d+(?:\.\d+)?)\s*(?:grams?|g)?/i,
            // Move animal: "move rat 5 to cage 12"
            MOVE: /move\s+(?:rat|mouse)\s+(\d+)\s+to\s+cage\s+(\d+)/i,
            // Query weight range: "what rats are around 300 grams" or "show rats around 300g"
            QUERY_WEIGHT: /(?:what|show|find)\s+(?:rats?|mice)\s+(?:are\s+)?around\s+(\d+(?:\.\d+)?)\s*(?:grams?|g)?/i,
            // System commands
            STOP: /(?:stop|pause|end)\s+(?:listening|recording|session)/i,
            START: /(?:start|begin|resume)\s+(?:listening|recording|session)/i,
            // Context queries
            LAST_READING: /(?:repeat|show)\s+last\s+reading/i,
            CURRENT_STATUS: /(?:what|show)\s+(?:is\s+)?(?:current|status)/i
        };
        this.databaseManager = databaseManager;
        const config = (0, app_config_1.loadConfig)();
        this.nluService = new AdaptiveNLUService_1.AdaptiveNLUService({
            // Use configuration from app-config.ts
            maxInferenceTime: config.ai.maxInferenceTime,
            enableBenchmarking: config.ai.enableBenchmarking
        });
    }
    /**
     * Process a transcription result into a command and execute it
     */
    async processCommand(transcription) {
        try {
            // Ensure we have an active session
            await this.ensureActiveSession();
            // Parse the transcription using AI-powered NLU
            const command = await this.parseCommandWithAI(transcription);
            // Log the command to history
            await this.logCommand(command, transcription);
            // Execute the command if confidence is high enough
            if (command.confidence >= 0.7 && !command.needsConfirmation) {
                return await this.executeCommand(command);
            }
            else {
                // Return confirmation request
                return {
                    success: false,
                    message: `Did you say: "${command.rawText}"?`,
                    needsConfirmation: true,
                    confirmationPrompt: this.generateConfirmationPrompt(command)
                };
            }
        }
        catch (error) {
            console.error('Error processing command:', error);
            return {
                success: false,
                message: `Error processing command: ${error.message}`
            };
        }
    }
    /**
     * Parse transcribed text using AI-powered NLU
     */
    async parseCommandWithAI(transcription) {
        try {
            // Use adaptive NLU service (automatically chooses best backend)
            let command = await this.nluService.parseCommand(transcription);
            // Apply context awareness
            command = await this.applyContext(command);
            return command;
        }
        catch (error) {
            console.warn('AI parsing failed, falling back to legacy method:', error.message);
            return this.parseCommandLegacy(transcription);
        }
    }
    /**
     * Legacy regex-based parsing (fallback)
     */
    async parseCommandLegacy(transcription) {
        const text = transcription.text.toLowerCase().trim();
        // Try to match against known patterns
        for (const [type, pattern] of Object.entries(this.COMMAND_PATTERNS)) {
            const match = text.match(pattern);
            if (match) {
                return await this.createCommand(type, match, transcription);
            }
        }
        // If no pattern matches, return a generic command
        return {
            type: 'system',
            confidence: transcription.confidence * 0.5, // Lower confidence for unrecognized commands
            entities: {},
            needsConfirmation: true,
            contextUsed: false,
            rawText: transcription.text
        };
    }
    /**
     * Apply session context to enhance command understanding
     */
    async applyContext(command) {
        // For update commands without a rat specified, use context
        if (command.type === 'update' && !command.entities.rat && this.sessionContext?.lastRat) {
            command.entities.rat = this.sessionContext.lastRat;
            command.contextUsed = true;
            command.needsConfirmation = false; // Don't need confirmation if we have good context
        }
        // For move commands, ensure we have both rat and cage
        if (command.type === 'move') {
            if (!command.entities.rat && this.sessionContext?.lastRat) {
                command.entities.rat = this.sessionContext.lastRat;
                command.contextUsed = true;
            }
        }
        // Adjust confidence based on context usage
        if (command.contextUsed) {
            command.confidence = Math.min(command.confidence + 0.1, 1.0);
        }
        return command;
    }
    /**
     * Create a structured command from pattern match
     */
    async createCommand(type, match, transcription) {
        let command = {
            type: 'system',
            confidence: transcription.confidence,
            entities: {},
            needsConfirmation: false,
            contextUsed: false,
            rawText: transcription.text
        };
        switch (type) {
            case 'RECORD':
                command = {
                    ...command,
                    type: 'record',
                    entities: {
                        rat: parseInt(match[1]),
                        cage: parseInt(match[2]),
                        weight: parseFloat(match[3])
                    }
                };
                break;
            case 'UPDATE_WEIGHT':
                const contextRat = this.sessionContext?.lastRat;
                command = {
                    ...command,
                    type: 'update',
                    entities: {
                        rat: contextRat || undefined,
                        weight: parseFloat(match[1])
                    },
                    needsConfirmation: !contextRat, // Need confirmation if no context
                    contextUsed: !!contextRat
                };
                break;
            case 'MOVE':
                command = {
                    ...command,
                    type: 'move',
                    entities: {
                        rat: parseInt(match[1]),
                        cage: parseInt(match[2])
                    }
                };
                break;
            case 'QUERY_WEIGHT':
                command = {
                    ...command,
                    type: 'query',
                    entities: {
                        weight: parseFloat(match[1])
                    }
                };
                break;
            case 'STOP':
            case 'START':
                command = {
                    ...command,
                    type: 'system',
                    entities: { action: type.toLowerCase() }
                };
                break;
            case 'LAST_READING':
            case 'CURRENT_STATUS':
                command = {
                    ...command,
                    type: 'query',
                    entities: { action: type.toLowerCase().replace('_', '') }
                };
                break;
        }
        // Determine if confirmation is needed based on confidence and context
        if (command.confidence < 0.8) {
            command.needsConfirmation = true;
        }
        return command;
    }
    /**
     * Execute a parsed command
     */
    async executeCommand(command) {
        try {
            switch (command.type) {
                case 'record':
                    return await this.executeRecordCommand(command);
                case 'update':
                    return await this.executeUpdateCommand(command);
                case 'move':
                    return await this.executeMoveCommand(command);
                case 'query':
                    return await this.executeQueryCommand(command);
                case 'system':
                    return await this.executeSystemCommand(command);
                default:
                    return {
                        success: false,
                        message: `Unknown command type: ${command.type}`
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Command execution failed: ${error.message}`
            };
        }
    }
    /**
     * Execute a record command (rat X cage Y weight Z)
     */
    async executeRecordCommand(command) {
        const { rat, cage, weight } = command.entities;
        if (!rat || !cage || !weight || !this.currentSessionId) {
            return {
                success: false,
                message: 'Missing required information for recording'
            };
        }
        try {
            // Ensure animal and cage exist
            const animal = await this.databaseManager.getOrCreateAnimal(rat);
            const cageObj = await this.databaseManager.getOrCreateCage(cage);
            // Record the reading
            const reading = await this.databaseManager.recordReading(rat, cage, weight, this.currentSessionId);
            // Update session context
            await this.updateSessionContext({ lastRat: rat, lastCage: cage, lastWeight: weight });
            return {
                success: true,
                message: `Logged. Rat ${rat}, cage ${cage}, ${weight} grams`,
                data: reading
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to record reading: ${error.message}`
            };
        }
    }
    /**
     * Execute an update command (change weight to X)
     */
    async executeUpdateCommand(command) {
        const { rat, weight } = command.entities;
        if (!weight || !this.currentSessionId) {
            return {
                success: false,
                message: 'Missing weight information'
            };
        }
        const targetRat = rat || this.sessionContext?.lastRat;
        if (!targetRat) {
            return {
                success: false,
                message: 'Which rat? No recent rat mentioned'
            };
        }
        try {
            await this.databaseManager.updateAnimalWeight(targetRat, weight, this.currentSessionId);
            await this.updateSessionContext({ lastWeight: weight });
            return {
                success: true,
                message: `Updated rat ${targetRat} weight to ${weight} grams`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to update weight: ${error.message}`
            };
        }
    }
    /**
     * Execute a move command (move rat X to cage Y)
     */
    async executeMoveCommand(command) {
        const { rat, cage } = command.entities;
        if (!rat || !cage) {
            return {
                success: false,
                message: 'Missing rat or cage information'
            };
        }
        try {
            // Ensure cage exists
            await this.databaseManager.getOrCreateCage(cage);
            // Move the animal
            await this.databaseManager.moveAnimal(rat, cage);
            // Update session context
            await this.updateSessionContext({ lastRat: rat, lastCage: cage });
            return {
                success: true,
                message: `Moved rat ${rat} to cage ${cage}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to move animal: ${error.message}`
            };
        }
    }
    /**
     * Execute a query command
     */
    async executeQueryCommand(command) {
        const { weight, action } = command.entities;
        try {
            if (weight) {
                // Query animals around a specific weight
                const animals = await this.databaseManager.getAnimalsAroundWeight(weight);
                if (animals.length === 0) {
                    return {
                        success: true,
                        message: `No rats found around ${weight} grams`
                    };
                }
                const results = animals.map(animal => `Rat ${animal.number} at ${animal.currentWeight}g in cage ${animal.currentCage || 'unknown'}`).join(', ');
                return {
                    success: true,
                    message: `Found ${animals.length} rats: ${results}`,
                    data: animals
                };
            }
            // Handle other query types
            switch (action) {
                case 'lastreading':
                    return await this.getLastReading();
                case 'currentstatus':
                    return await this.getCurrentStatus();
                default:
                    return {
                        success: false,
                        message: 'Unknown query type'
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Query failed: ${error.message}`
            };
        }
    }
    /**
     * Execute system commands
     */
    async executeSystemCommand(command) {
        const { action } = command.entities;
        switch (action) {
            case 'stop':
                return {
                    success: true,
                    message: 'Stopping listening mode',
                    data: { action: 'stop_listening' }
                };
            case 'start':
                return {
                    success: true,
                    message: 'Starting listening mode',
                    data: { action: 'start_listening' }
                };
            default:
                return {
                    success: false,
                    message: 'Unknown system command'
                };
        }
    }
    /**
     * Get the last reading from current session
     */
    async getLastReading() {
        // Implementation would query the most recent reading
        // For now, return context info
        if (this.sessionContext?.lastRat && this.sessionContext?.lastWeight) {
            return {
                success: true,
                message: `Last reading: Rat ${this.sessionContext.lastRat}, ${this.sessionContext.lastWeight} grams`
            };
        }
        return {
            success: true,
            message: 'No recent readings in this session'
        };
    }
    /**
     * Get current session status
     */
    async getCurrentStatus() {
        const status = [];
        if (this.sessionContext?.lastRat) {
            status.push(`Current rat: ${this.sessionContext.lastRat}`);
        }
        if (this.sessionContext?.lastCage) {
            status.push(`Current cage: ${this.sessionContext.lastCage}`);
        }
        if (this.sessionContext?.lastWeight) {
            status.push(`Last weight: ${this.sessionContext.lastWeight}g`);
        }
        return {
            success: true,
            message: status.length > 0 ? status.join(', ') : 'No current context'
        };
    }
    /**
     * Generate confirmation prompt for ambiguous commands
     */
    generateConfirmationPrompt(command) {
        switch (command.type) {
            case 'record':
                return `Record rat ${command.entities.rat} in cage ${command.entities.cage} with weight ${command.entities.weight} grams?`;
            case 'update':
                const rat = command.entities.rat || 'current rat';
                return `Update ${rat} weight to ${command.entities.weight} grams?`;
            case 'move':
                return `Move rat ${command.entities.rat} to cage ${command.entities.cage}?`;
            default:
                return `Execute command: ${command.rawText}?`;
        }
    }
    /**
     * Ensure there's an active session
     */
    async ensureActiveSession() {
        if (!this.currentSessionId) {
            const session = await this.databaseManager.getCurrentSession();
            if (session) {
                this.currentSessionId = session.id;
                this.sessionContext = await this.databaseManager.getSessionContext(session.id);
            }
            else {
                const newSession = await this.databaseManager.startSession();
                this.currentSessionId = newSession.id;
                this.sessionContext = null;
            }
        }
    }
    /**
     * Update session context
     */
    async updateSessionContext(updates) {
        if (!this.currentSessionId)
            return;
        await this.databaseManager.updateSessionContext(this.currentSessionId, updates);
        // Update local context
        if (this.sessionContext) {
            Object.assign(this.sessionContext, updates);
        }
        else {
            this.sessionContext = {
                sessionId: this.currentSessionId,
                lastRat: updates.lastRat || null,
                lastCage: updates.lastCage || null,
                lastWeight: updates.lastWeight || null,
                updatedAt: new Date()
            };
        }
    }
    /**
     * Log command to history
     */
    async logCommand(command, transcription) {
        if (!this.currentSessionId)
            return;
        // Create a serializable version of the command
        const serializableCommand = {
            type: command.type,
            confidence: command.confidence,
            needsConfirmation: command.needsConfirmation,
            entities: command.entities,
            contextUsed: command.contextUsed,
            rawText: command.rawText
        };
        await this.databaseManager.logCommand(this.currentSessionId, transcription.text, JSON.stringify(serializableCommand), command.confidence, !command.needsConfirmation);
    }
    /**
     * Get current session context
     */
    getCurrentContext() {
        return this.sessionContext;
    }
    /**
     * Get comprehensive NLU system status
     */
    async getNLUStatus() {
        return await this.nluService.getSystemStatus();
    }
    /**
     * Get current NLU backend information
     */
    getCurrentNLUBackend() {
        return this.nluService.getCurrentBackend();
    }
    /**
     * Switch NLU backend manually
     */
    async switchNLUBackend(backend) {
        return await this.nluService.switchBackend(backend);
    }
    /**
     * Reset session context
     */
    async resetContext() {
        this.sessionContext = null;
        this.currentSessionId = null;
    }
}
exports.CommandService = CommandService;
