"use strict";
/**
 * Natural Language Understanding Service
 * Uses local AI models for enhanced command understanding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLUService = void 0;
const ollama_1 = require("ollama");
class NLUService {
    constructor() {
        this.isInitialized = false;
        this.modelName = 'llama3.2:3b';
        this.ollama = new ollama_1.Ollama();
        this.initialize();
    }
    /**
     * Initialize the NLU service and check model availability
     */
    async initialize() {
        try {
            // Check if Ollama is running and model is available
            const models = await this.ollama.list();
            const hasModel = models.models.some((model) => model.name.includes('llama3.2'));
            if (!hasModel) {
                console.log('Downloading Llama 3.2 3B model for command understanding...');
                await this.ollama.pull({ model: this.modelName });
                console.log('Model downloaded successfully');
            }
            this.isInitialized = true;
            console.log('NLU Service initialized with local AI model');
        }
        catch (error) {
            console.warn('Failed to initialize AI model, falling back to regex:', error.message);
            this.isInitialized = false;
            // AI model failed, will use regex fallback
        }
    }
    /**
     * Parse a transcription using AI-powered understanding
     */
    async parseCommand(transcription) {
        if (!this.isInitialized) {
            return this.fallbackRegexParsing(transcription.text);
        }
        try {
            const prompt = this.buildPrompt(transcription.text);
            const response = await this.ollama.generate({
                model: this.modelName,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1, // Low temperature for consistent outputs
                    top_p: 0.9,
                    num_predict: 200
                }
            });
            return this.parseAIResponse(response.response, transcription.confidence);
        }
        catch (error) {
            console.warn('AI parsing failed, falling back to regex:', error.message);
            return this.fallbackRegexParsing(transcription.text);
        }
    }
    /**
     * Build a structured prompt for the AI model
     */
    buildPrompt(text) {
        return `You are a lab data entry assistant. Parse this voice command into structured data.

Command: "${text}"

Extract:
- Intent: record|update|move|query|system|unknown
- Entities: rat number, cage number, weight (grams), action

Return JSON only:
{
  "intent": "record",
  "entities": {
    "rat": 5,
    "cage": 3,
    "weight": 280.5
  },
  "confidence": 0.95,
  "reasoning": "Clear command with all required entities"
}

Examples:
"rat 5 cage 3 weight 280 grams" → intent: record, rat: 5, cage: 3, weight: 280
"change weight to 300 grams" → intent: update, weight: 300
"move rat 7 to cage 12" → intent: move, rat: 7, cage: 12
"show rats around 250 grams" → intent: query, weight: 250
"stop listening" → intent: system, action: "stop"

Handle variations like:
- "weigh rat number 5 in cage 3 at 280 grams"
- "rat five cage three two hundred eighty grams"
- "update the weight to three hundred"
- "move animal 7 into cage number 12"

Parse: "${text}"
JSON:`;
    }
    /**
     * Parse the AI model's response into structured data
     */
    parseAIResponse(response, originalConfidence) {
        try {
            // Extract JSON from response (AI might add extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            // Validate and clean the response
            return {
                intent: parsed.intent || 'unknown',
                entities: {
                    rat: this.parseNumber(parsed.entities?.rat),
                    cage: this.parseNumber(parsed.entities?.cage),
                    weight: this.parseNumber(parsed.entities?.weight),
                    group: parsed.entities?.group,
                    action: parsed.entities?.action
                },
                confidence: Math.min(parsed.confidence || 0.8, originalConfidence),
                reasoning: parsed.reasoning
            };
        }
        catch (error) {
            console.warn('Failed to parse AI response:', error.message);
            return this.fallbackRegexParsing(response);
        }
    }
    /**
     * Parse number with support for word numbers
     */
    parseNumber(value) {
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string') {
            // Handle word numbers
            const wordNumbers = {
                'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
                'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
                'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
                'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
            };
            const lower = value.toLowerCase();
            if (wordNumbers[lower] !== undefined) {
                return wordNumbers[lower];
            }
            const num = parseFloat(value);
            return isNaN(num) ? undefined : num;
        }
        return undefined;
    }
    /**
     * Fallback regex parsing (existing logic)
     */
    fallbackRegexParsing(text) {
        const patterns = {
            RECORD: /(?:rat|mouse)\s+(\d+)\s+cage\s+(\d+)\s+weight\s+(\d+(?:\.\d+)?)\s*(?:grams?|g)?/i,
            UPDATE_WEIGHT: /(?:change|update|set)\s+weight\s+to\s+(\d+(?:\.\d+)?)\s*(?:grams?|g)?/i,
            MOVE: /move\s+(?:rat|mouse)\s+(\d+)\s+to\s+cage\s+(\d+)/i,
            QUERY_WEIGHT: /(?:what|show|find)\s+(?:rats?|mice)\s+(?:are\s+)?around\s+(\d+(?:\.\d+)?)\s*(?:grams?|g)?/i,
            STOP: /(?:stop|pause|end)\s+(?:listening|recording|session)/i,
            START: /(?:start|begin|resume)\s+(?:listening|recording|session)/i
        };
        const lower = text.toLowerCase().trim();
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = lower.match(pattern);
            if (match) {
                switch (type) {
                    case 'RECORD':
                        return {
                            intent: 'record',
                            entities: {
                                rat: parseInt(match[1]),
                                cage: parseInt(match[2]),
                                weight: parseFloat(match[3])
                            },
                            confidence: 0.9
                        };
                    case 'UPDATE_WEIGHT':
                        return {
                            intent: 'update',
                            entities: { weight: parseFloat(match[1]) },
                            confidence: 0.85
                        };
                    case 'MOVE':
                        return {
                            intent: 'move',
                            entities: {
                                rat: parseInt(match[1]),
                                cage: parseInt(match[2])
                            },
                            confidence: 0.9
                        };
                    case 'QUERY_WEIGHT':
                        return {
                            intent: 'query',
                            entities: { weight: parseFloat(match[1]) },
                            confidence: 0.8
                        };
                    case 'STOP':
                    case 'START':
                        return {
                            intent: 'system',
                            entities: { action: type.toLowerCase() },
                            confidence: 0.95
                        };
                }
            }
        }
        return {
            intent: 'unknown',
            entities: {},
            confidence: 0.3
        };
    }
    /**
     * Convert NLU result to legacy Command format
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
            contextUsed: false, // Will be determined by CommandService
            rawText: transcription.text
        };
    }
    /**
     * Get model status and information
     */
    async getModelInfo() {
        try {
            if (!this.isInitialized) {
                return { available: false, modelName: this.modelName };
            }
            const models = await this.ollama.list();
            const model = models.models.find((m) => m.name.includes('llama3.2'));
            return {
                available: !!model,
                modelName: this.modelName,
                size: model ? `${Math.round(model.size / 1024 / 1024 / 1024 * 10) / 10}GB` : undefined
            };
        }
        catch (error) {
            return { available: false, modelName: this.modelName };
        }
    }
}
exports.NLUService = NLUService;
