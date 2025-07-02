/**
 * Lightweight NLU Service - Optimized for lab commands only
 * Uses tiny models or llama.cpp for ultra-fast inference
 */

import { Ollama } from 'ollama';
import { Command, TranscriptionResult } from '../../shared/types';
import { AI_MODELS } from '../../shared/app-config';

export interface LightNLUResult {
  intent: string;
  entities: {
    rat?: number;
    cage?: number;
    weight?: number;
    action?: string;
  };
  confidence: number;
}

export class LightNLUService {
  private isInitialized: boolean = false;
  private ollama: Ollama;
  private modelName: string;
  private useClassificationApproach: boolean = true;

  // Ultra-lightweight classification patterns
  private readonly INTENT_KEYWORDS = {
    record: ['rat', 'cage', 'weight', 'grams', 'weigh', 'measure'],
    update: ['change', 'update', 'set', 'modify', 'adjust'],
    move: ['move', 'transfer', 'relocate', 'put'],
    query: ['show', 'find', 'what', 'which', 'around', 'near'],
    system: ['stop', 'start', 'pause', 'resume', 'listen']
  };

  // Number word mappings
  private readonly WORD_TO_NUMBER: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
    // Common lab numbers
    'twenty-five': 25, 'twenty five': 25, 'seventy-five': 75,
    'two-fifty': 250, 'two fifty': 250, 'three hundred': 300, 'two-eighty': 280
  };

  constructor(modelType: 'tiny' | 'mini' | 'classification' = 'mini') {
    this.ollama = new Ollama();
    
    switch (modelType) {
      case 'tiny':
        this.modelName = AI_MODELS.OLLAMA_TINY;
        break;
      case 'mini':
        this.modelName = AI_MODELS.OLLAMA_LIGHT;
        break;
      case 'classification':
        this.useClassificationApproach = true;
        this.modelName = AI_MODELS.OLLAMA_LIGHT; // Fallback model name
        break;
    }
    
    this.initialize();
  }

  /**
   * Initialize with lightweight approach
   */
  private async initialize(): Promise<void> {
    try {
      if (this.useClassificationApproach) {
        // For classification approach, we don't need to download large models
        this.isInitialized = true;
        console.log('Light NLU Service initialized with classification approach');
        return;
      }

      // Check if model exists
      const models = await this.ollama.list();
      const hasModel = models.models.some((model: any) => 
        model.name.includes(this.modelName.split(':')[0])
      );
      
      if (!hasModel) {
        console.log(`Downloading ${this.modelName} for lightweight NLU...`);
        await this.ollama.pull({ model: this.modelName });
        console.log('Lightweight model downloaded successfully');
      }
      
      this.isInitialized = true;
      console.log(`Light NLU Service initialized with ${this.modelName}`);
    } catch (error) {
      console.warn('Failed to initialize lightweight AI model:', error.message);
      this.isInitialized = false;
      this.useClassificationApproach = true; // Fallback to classification
    }
  }

  /**
   * Parse command using lightweight approach
   */
  async parseCommand(transcription: TranscriptionResult): Promise<LightNLUResult> {
    if (this.useClassificationApproach) {
      return this.classificationBasedParsing(transcription.text);
    }

    if (!this.isInitialized) {
      return this.classificationBasedParsing(transcription.text);
    }

    try {
      return await this.aiBasedParsing(transcription.text);
    } catch (error) {
      console.warn('AI parsing failed, using classification:', error.message);
      return this.classificationBasedParsing(transcription.text);
    }
  }

  /**
   * Ultra-fast classification-based parsing (no AI model needed)
   */
  private classificationBasedParsing(text: string): LightNLUResult {
    const normalized = text.toLowerCase().trim();
    const words = normalized.split(/\s+/);
    
    // Classify intent based on keywords
    let intent = 'unknown';
    let maxScore = 0;
    
    for (const [intentType, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      const score = keywords.reduce((acc, keyword) => 
        acc + (normalized.includes(keyword) ? 1 : 0), 0
      );
      
      if (score > maxScore) {
        maxScore = score;
        intent = intentType;
      }
    }

    // Extract entities using smart pattern matching
    const entities = this.extractEntitiesFromText(normalized, words);
    
    // Calculate confidence based on pattern strength
    const confidence = this.calculateConfidence(intent, entities, maxScore, words.length);

    return { intent, entities, confidence };
  }

  /**
   * AI-based parsing with minimal prompt
   */
  private async aiBasedParsing(text: string): Promise<LightNLUResult> {
    const prompt = this.buildMinimalPrompt(text);
    
    const response = await this.ollama.generate({
      model: this.modelName,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        num_predict: 100 // Limit response length
      }
    });

    return this.parseMinimalResponse(response.response);
  }

  /**
   * Build ultra-minimal prompt for efficiency
   */
  private buildMinimalPrompt(text: string): string {
    return `Parse lab command to JSON:
"${text}"

Return ONLY: {"intent":"record|update|move|query|system","entities":{"rat":5,"cage":3,"weight":280}}

Intents:
record: rat X cage Y weight Z
update: change weight to Z  
move: move rat X to cage Y
query: show rats around Z
system: stop/start

JSON:`;
  }

  /**
   * Parse minimal AI response
   */
  private parseMinimalResponse(response: string): LightNLUResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[^}]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        intent: parsed.intent || 'unknown',
        entities: {
          rat: this.parseNumber(parsed.entities?.rat),
          cage: this.parseNumber(parsed.entities?.cage),
          weight: this.parseNumber(parsed.entities?.weight),
          action: parsed.entities?.action
        },
        confidence: 0.9
      };
    } catch (error) {
      // Fallback to classification
      return this.classificationBasedParsing(response);
    }
  }

  /**
   * Extract entities using pattern matching and word parsing
   */
  private extractEntitiesFromText(text: string, words: string[]): any {
    const entities: any = {};
    
    // Extract numbers (rat IDs, cage numbers, weights)
    const numbers = this.extractAllNumbers(text, words);
    
    // Smart assignment based on context
    if (text.includes('rat') || text.includes('mouse') || text.includes('animal')) {
      const ratIdx = words.findIndex(w => ['rat', 'mouse', 'animal'].includes(w));
      if (ratIdx >= 0 && ratIdx < words.length - 1) {
        entities.rat = this.parseNumber(words[ratIdx + 1]) || numbers[0];
      }
    }
    
    if (text.includes('cage')) {
      const cageIdx = words.findIndex(w => w === 'cage');
      if (cageIdx >= 0 && cageIdx < words.length - 1) {
        entities.cage = this.parseNumber(words[cageIdx + 1]) || numbers[1];
      }
    }
    
    if (text.includes('weight') || text.includes('gram') || text.includes('weigh')) {
      // Look for weight patterns
      const weightPatterns = [
        /(\d+(?:\.\d+)?)\s*(?:grams?|g)/i,
        /weight\s+(?:to\s+)?(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*(?:gram|g)/i
      ];
      
      for (const pattern of weightPatterns) {
        const match = text.match(pattern);
        if (match) {
          entities.weight = parseFloat(match[1]);
          break;
        }
      }
      
      // Fallback to numbers in context
      if (!entities.weight && numbers.length > 0) {
        entities.weight = numbers.find(n => n > 50) || numbers[numbers.length - 1];
      }
    }
    
    // System actions
    if (text.includes('stop') || text.includes('pause')) {
      entities.action = 'stop';
    } else if (text.includes('start') || text.includes('begin') || text.includes('resume')) {
      entities.action = 'start';
    }
    
    return entities;
  }

  /**
   * Extract all numbers from text including word numbers
   */
  private extractAllNumbers(text: string, words: string[]): number[] {
    const numbers: number[] = [];
    
    // Extract digit numbers
    const digitMatches = text.match(/\d+(?:\.\d+)?/g);
    if (digitMatches) {
      numbers.push(...digitMatches.map(n => parseFloat(n)));
    }
    
    // Extract word numbers
    for (const word of words) {
      if (this.WORD_TO_NUMBER[word] !== undefined) {
        numbers.push(this.WORD_TO_NUMBER[word]);
      }
    }
    
    // Handle compound numbers like "two fifty" -> 250
    for (let i = 0; i < words.length - 1; i++) {
      const compound = `${words[i]} ${words[i + 1]}`;
      if (this.WORD_TO_NUMBER[compound] !== undefined) {
        numbers.push(this.WORD_TO_NUMBER[compound]);
      }
    }
    
    return numbers.filter((n, i, arr) => arr.indexOf(n) === i); // Remove duplicates
  }

  /**
   * Parse number with enhanced word support
   */
  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      
      // Check word number mapping
      if (this.WORD_TO_NUMBER[lower] !== undefined) {
        return this.WORD_TO_NUMBER[lower];
      }
      
      // Parse as number
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  /**
   * Calculate confidence based on parsing success
   */
  private calculateConfidence(intent: string, entities: any, keywordScore: number, wordCount: number): number {
    let confidence = 0.5; // Base confidence
    
    // Boost for recognized intent
    if (intent !== 'unknown') {
      confidence += 0.2;
    }
    
    // Boost for keyword matches
    confidence += Math.min(keywordScore * 0.1, 0.3);
    
    // Boost for extracted entities
    const entityCount = Object.values(entities).filter(v => v !== undefined).length;
    confidence += entityCount * 0.1;
    
    // Penalty for very long or very short commands
    if (wordCount < 3 || wordCount > 15) {
      confidence -= 0.1;
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  /**
   * Convert to legacy Command format
   */
  nluResultToCommand(result: LightNLUResult, transcription: TranscriptionResult): Command {
    const commandTypeMap: { [key: string]: Command['type'] } = {
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
   * Get service status
   */
  async getModelInfo(): Promise<{ available: boolean; modelName: string; approach: string; size?: string }> {
    if (this.useClassificationApproach) {
      return {
        available: true,
        modelName: 'classification',
        approach: 'keyword-based',
        size: '<1MB'
      };
    }

    try {
      const models = await this.ollama.list();
      const model = models.models.find((m: any) => 
        m.name.includes(this.modelName.split(':')[0])
      );
      
      return {
        available: !!model,
        modelName: this.modelName,
        approach: 'ai-based',
        size: model ? `${Math.round(model.size / 1024 / 1024 / 1024 * 10) / 10}GB` : undefined
      };
    } catch (error) {
      return { 
        available: false, 
        modelName: this.modelName, 
        approach: 'ai-based' 
      };
    }
  }
}