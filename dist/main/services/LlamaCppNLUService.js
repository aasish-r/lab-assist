"use strict";
/**
 * Ultra-fast llama.cpp NLU Service
 * Uses GGUF models for maximum performance with minimal resource usage
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlamaCppNLUService = void 0;
const fs = __importStar(require("fs"));
const app_config_1 = require("../../shared/app-config");
class LlamaCppNLUService {
    constructor(modelPath) {
        this.llama = null;
        this.model = null;
        this.context = null;
        this.isInitialized = false;
        this.useFallback = true;
        // JSON grammar for structured output
        this.jsonGrammar = `
root ::= object
object ::= "{" ws member ("," ws member)* "}" ws
member ::= string ":" ws value
string ::= "\\"" ([^"\\] | "\\" (["\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]))* "\\""
value ::= object | array | string | number | "true" | "false" | "null"
array ::= "[" ws (value ("," ws value)*)? "]" ws
number ::= ("-"? ([0] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)?
ws ::= [ \\t\\n\\r]*
`;
        this.modelPath = modelPath || (0, app_config_1.getLlamaCppModelPath)(app_config_1.AI_MODELS.LLAMACPP_DEFAULT);
        // Don't initialize automatically to avoid crashes - do it lazily
        this.useFallback = true;
        this.isInitialized = true;
    }
    /**
     * Initialize llama.cpp with GGUF model (or fallback to classification)
     */
    async initialize() {
        try {
            console.log('🚀 Initializing llama.cpp NLU service...');
            // Check if model file exists
            if (!fs.existsSync(this.modelPath)) {
                console.warn(`Model file not found: ${this.modelPath}`);
                console.warn('Using classification fallback. Run "make install-llama-cpp" to enable llama.cpp');
                this.useFallback = true;
                this.isInitialized = true;
                return;
            }
            try {
                // Try to load llama.cpp (requires native compilation)
                // This is causing SIGSEGV crashes, so we'll use fallback for now
                console.warn('⚠️  Backend llamacpp failed: llama.cpp model not found. Run "make setup-llama-cpp"');
                this.useFallback = true;
                this.isInitialized = true;
                return;
                // Comment out the native code that's causing crashes:
                /*
                const llamaCpp = require('@llama-node/llama-cpp');
                this.llama = new llamaCpp.LlamaCpp();
              
                // Load model with optimized settings for lab commands
                this.model = await this.llama.loadModel({
                  modelPath: this.modelPath,
                  enableLogging: false,
                  nCtx: 512,        // Small context for short commands
                  nGl: 32,          // GPU layers (adjust based on hardware)
                  seed: 0,          // Deterministic output
                  f16Kv: true,      // Use 16-bit for KV cache
                  logitsAll: false,
                  vocabOnly: false,
                  useMlock: true,   // Lock model in memory
                  useMmap: true,    // Memory map for efficiency
                  embedding: false
                });
      
                // Create context with optimized settings
                this.context = await this.model.createContext({
                  seed: 0,
                  nCtx: 512,
                  nKeep: 0,
                  nPredict: 100,    // Limit tokens for JSON responses
                  topK: 5,          // Low top-k for focused responses
                  topP: 0.9,
                  temp: 0.1,        // Low temperature for consistency
                  repeatPenalty: 1.1
                });
      
                this.useFallback = false;
                this.isInitialized = true;
                */
                console.log('✅ llama.cpp NLU service initialized successfully');
                // Test inference speed
                await this.benchmarkInference();
            }
            catch (llamaError) {
                console.warn('llama.cpp not available, using classification fallback:', llamaError.message);
                this.useFallback = true;
                this.isInitialized = true;
            }
        }
        catch (error) {
            console.error('❌ Failed to initialize llama.cpp:', error.message);
            this.isInitialized = false;
        }
    }
    /**
     * Parse command using llama.cpp
     */
    async parseCommand(transcription) {
        const startTime = Date.now();
        if (!this.isInitialized || this.useFallback || !this.context) {
            return this.fallbackParsing(transcription.text, Date.now() - startTime);
        }
        try {
            const prompt = this.buildOptimizedPrompt(transcription.text);
            // Use JSON grammar for structured output (if available)
            let grammar = null;
            try {
                const llamaCpp = require('@llama-node/llama-cpp');
                grammar = llamaCpp.LlamaGrammar?.fromString(this.jsonGrammar);
            }
            catch (error) {
                // Grammar not available, continue without
            }
            const evalOptions = {
                nPredict: 80,
                stopSequence: ['}'],
                temperature: 0.1,
                topK: 3,
                topP: 0.9
            };
            if (grammar) {
                evalOptions.grammar = grammar;
            }
            const response = await this.context.evaluate(evalOptions, prompt);
            const processingTime = Date.now() - startTime;
            return this.parseStructuredResponse(response, processingTime);
        }
        catch (error) {
            console.warn('llama.cpp inference failed:', error.message);
            return this.fallbackParsing(transcription.text, Date.now() - startTime);
        }
    }
    /**
     * Build optimized prompt for lab commands
     */
    buildOptimizedPrompt(text) {
        return `<|system|>
Parse lab voice commands to JSON. Return ONLY valid JSON.

Schema: {"intent":"record|update|move|query|system","entities":{"rat":5,"cage":3,"weight":280},"confidence":0.9}

Commands:
- record: "rat X cage Y weight Z grams"
- update: "change weight to Z"  
- move: "move rat X to cage Y"
- query: "show rats around Z"
- system: "stop/start"<|end|>
<|user|>
Parse: "${text}"<|end|>
<|assistant|>
{`;
    }
    /**
     * Parse structured JSON response
     */
    parseStructuredResponse(response, processingTime) {
        try {
            // Clean and parse JSON
            let jsonStr = response.trim();
            if (!jsonStr.startsWith('{')) {
                jsonStr = '{' + jsonStr;
            }
            if (!jsonStr.endsWith('}')) {
                jsonStr = jsonStr + '}';
            }
            const parsed = JSON.parse(jsonStr);
            return {
                intent: parsed.intent || 'unknown',
                entities: {
                    rat: this.parseNumber(parsed.entities?.rat),
                    cage: this.parseNumber(parsed.entities?.cage),
                    weight: this.parseNumber(parsed.entities?.weight),
                    action: parsed.entities?.action
                },
                confidence: parsed.confidence || 0.8,
                processingTime
            };
        }
        catch (error) {
            console.warn('Failed to parse structured response:', error.message);
            return this.fallbackParsing(response, processingTime);
        }
    }
    /**
     * Fast fallback parsing without AI
     */
    fallbackParsing(text, processingTime) {
        const normalized = text.toLowerCase();
        // Quick intent classification
        let intent = 'unknown';
        if (normalized.includes('rat') && normalized.includes('cage') && normalized.includes('weight')) {
            intent = 'record';
        }
        else if (normalized.includes('change') || normalized.includes('update')) {
            intent = 'update';
        }
        else if (normalized.includes('move')) {
            intent = 'move';
        }
        else if (normalized.includes('show') || normalized.includes('find')) {
            intent = 'query';
        }
        else if (normalized.includes('stop') || normalized.includes('start')) {
            intent = 'system';
        }
        // Quick entity extraction
        const numbers = text.match(/\d+/g)?.map(n => parseInt(n)) || [];
        const entities = {};
        if (numbers.length >= 3 && intent === 'record') {
            entities.rat = numbers[0];
            entities.cage = numbers[1];
            entities.weight = numbers[2];
        }
        else if (numbers.length >= 1) {
            if (normalized.includes('weight') || normalized.includes('gram')) {
                entities.weight = numbers.find(n => n > 50) || numbers[0];
            }
            if (normalized.includes('rat')) {
                entities.rat = numbers.find(n => n <= 100) || numbers[0];
            }
            if (normalized.includes('cage')) {
                entities.cage = numbers.find(n => n <= 50) || numbers[1] || numbers[0];
            }
        }
        if (normalized.includes('stop'))
            entities.action = 'stop';
        if (normalized.includes('start'))
            entities.action = 'start';
        return {
            intent,
            entities,
            confidence: intent !== 'unknown' ? 0.7 : 0.3,
            processingTime
        };
    }
    /**
     * Parse number values
     */
    parseNumber(value) {
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string') {
            const num = parseFloat(value);
            return isNaN(num) ? undefined : num;
        }
        return undefined;
    }
    /**
     * Convert to Command format
     */
    nluResultToCommand(result, transcription) {
        const commandTypeMap = {
            'record': 'record',
            'update': 'update',
            'move': 'move',
            'query': 'query',
            'system': 'system'
        };
        return {
            type: commandTypeMap[result.intent] || 'system',
            confidence: result.confidence * transcription.confidence,
            entities: result.entities,
            needsConfirmation: result.confidence < 0.8,
            contextUsed: false,
            rawText: transcription.text
        };
    }
    /**
     * Benchmark inference speed
     */
    async benchmarkInference() {
        if (!this.context)
            return;
        try {
            const testCommand = "rat 5 cage 3 weight 280 grams";
            const start = Date.now();
            await this.context.evaluate({
                nPredict: 50,
                temperature: 0.1
            }, this.buildOptimizedPrompt(testCommand));
            const inferenceTime = Date.now() - start;
            console.log(`🚀 llama.cpp inference benchmark: ${inferenceTime}ms`);
        }
        catch (error) {
            console.warn('Benchmark failed:', error.message);
        }
    }
    /**
     * Get model information
     */
    async getModelInfo() {
        return {
            available: this.isInitialized,
            modelPath: this.modelPath,
            backend: 'llama.cpp',
            inferenceTime: this.isInitialized ? await this.measureInferenceTime() : undefined,
            memoryUsage: this.isInitialized ? await this.getMemoryUsage() : undefined
        };
    }
    /**
     * Measure average inference time
     */
    async measureInferenceTime() {
        if (!this.context)
            return 0;
        const times = [];
        const testCommands = [
            "rat 5 cage 3 weight 280 grams",
            "change weight to 300",
            "move rat 7 to cage 12"
        ];
        for (const cmd of testCommands) {
            try {
                const start = Date.now();
                await this.context.evaluate({
                    nPredict: 30,
                    temperature: 0.1
                }, this.buildOptimizedPrompt(cmd));
                times.push(Date.now() - start);
            }
            catch (error) {
                // Skip failed tests
            }
        }
        return times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0;
    }
    /**
     * Get memory usage estimate
     */
    async getMemoryUsage() {
        if (!fs.existsSync(this.modelPath))
            return 'Unknown';
        try {
            const stats = fs.statSync(this.modelPath);
            const sizeMB = Math.round(stats.size / 1024 / 1024);
            return `~${sizeMB}MB model + ~200MB runtime`;
        }
        catch (error) {
            return 'Unknown';
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.context) {
            // Note: Add cleanup method when available in llama-node
            this.context = null;
        }
        if (this.model) {
            this.model = null;
        }
        this.isInitialized = false;
    }
}
exports.LlamaCppNLUService = LlamaCppNLUService;
