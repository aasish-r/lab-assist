/**
 * Adaptive NLU Service - Chooses best approach based on available resources
 * Falls back gracefully from llama.cpp -> Ollama -> Classification
 */

import { NLUService } from './NLUService';
import { LightNLUService } from './LightNLUService';
// import { LlamaCppNLUService } from './LlamaCppNLUService'; // Disabled to avoid crashes
import { Command, TranscriptionResult } from '../../shared/types';
import { loadConfig, AppConfig, AIBackend, BACKEND_CONFIG, getBackendConfig, getTimeoutForBackend } from '../../shared/app-config';
import * as fs from 'fs';

type NLUBackend = 'llamacpp' | 'ollama-light' | 'ollama-full' | 'ollama-tiny' | 'classification';

export interface AdaptiveNLUConfig {
  preferredBackend?: NLUBackend;
  maxInferenceTime?: number; // milliseconds
  enableBenchmarking?: boolean;
  llamaCppModelPath?: string;
}

export class AdaptiveNLUService {
  private activeService: any = null;
  private activeBackend: NLUBackend = 'classification';
  private config: AdaptiveNLUConfig;
  private performanceStats: Map<NLUBackend, { avgTime: number; successRate: number }> = new Map();

  constructor(config: AdaptiveNLUConfig = {}) {
    const appConfig = loadConfig();
    
    this.config = {
      preferredBackend: appConfig.ai.preferredBackend as NLUBackend,
      maxInferenceTime: appConfig.ai.maxInferenceTime,
      enableBenchmarking: appConfig.ai.enableBenchmarking,
      ...config // Allow override
    };

    this.initializeBestAvailableService();
  }

  /**
   * Initialize the best available NLU service
   */
  private async initializeBestAvailableService(): Promise<void> {
    console.log('🧠 Initializing Adaptive NLU Service...');

    // Try backends in order of preference and performance
    // Default order now prioritizes smaller footprint
    const appConfig = loadConfig();
    const backendPriority: NLUBackend[] = [
      this.config.preferredBackend!,
      ...appConfig.ai.fallbackOrder.filter(b => b !== this.config.preferredBackend) as NLUBackend[]
    ];

    const backendInfo = getBackendConfig(this.config.preferredBackend as AIBackend);
    console.log(`🎯 AI Backend preference: ${this.config.preferredBackend} (${backendInfo?.size || 'unknown'})`);
    console.log(`📋 Fallback order: ${backendPriority.slice(1).join(' → ')}`);

    for (const backend of backendPriority) {
      try {
        const service = await this.tryInitializeBackend(backend);
        if (service) {
          this.activeService = service;
          this.activeBackend = backend;
          console.log(`✅ Active NLU backend: ${backend}`);
          
          if (this.config.enableBenchmarking) {
            await this.runBenchmark(backend, service);
          }
          
          return;
        }
      } catch (error) {
        console.warn(`⚠️  Backend ${backend} failed:`, error.message);
      }
    }

    // Fallback to classification if all else fails
    this.activeService = new LightNLUService('classification');
    this.activeBackend = 'classification';
    console.log('⚡ Using classification-based NLU (ultra-fast fallback)');
  }

  /**
   * Try to initialize a specific backend
   */
  private async tryInitializeBackend(backend: NLUBackend): Promise<any> {
    switch (backend) {
      case 'llamacpp':
        return await this.tryLlamaCpp();
      
      case 'ollama-tiny':
        return await this.tryOllamaTiny();
      
      case 'ollama-light':
        return await this.tryOllamaLight();
      
      case 'ollama-full':
        return await this.tryOllamaFull();
      
      case 'classification':
        return new LightNLUService('classification');
      
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  /**
   * Try llama.cpp backend
   */
  private async tryLlamaCpp(): Promise<any | null> {
    // Disable llamacpp backend to avoid SIGSEGV crashes
    throw new Error('llama.cpp backend disabled to avoid crashes. Use "make setup-llama-cpp" for proper setup.');
    
    // Original code commented out:
    /*
    // Check if model file exists
    const modelPath = this.config.llamaCppModelPath || 
      require('path').join(process.cwd(), 'models', 'phi-3-mini-4k-instruct.Q4_K_M.gguf');
    
    if (!fs.existsSync(modelPath)) {
      throw new Error('llama.cpp model not found. Run "make setup-llama-cpp"');
    }

    try {
      const { LlamaCppNLUService } = require('./LlamaCppNLUService');
      const service = new LlamaCppNLUService(modelPath);
      
      // Wait for initialization (with timeout)
      await this.waitForInitialization(service, 10000);
      
      return service;
    } catch (error) {
      // If native module loading fails, throw error to fall back
      throw new Error(`Failed to initialize llama.cpp: ${error.message}`);
    }
    */
  }

  /**
   * Try ultra-lightweight Ollama backend (TinyLlama)
   */
  private async tryOllamaTiny(): Promise<LightNLUService | null> {
    const service = new LightNLUService('tiny'); // TinyLlama 1.1B
    
    // Test if Ollama is available
    try {
      const info = await service.getModelInfo();
      if (!info.available) {
        throw new Error('Ollama tiny model not available. Run "make quick-tiny" to install.');
      }
      return service;
    } catch (error) {
      throw new Error(`Ollama tiny initialization failed: ${error.message}`);
    }
  }

  /**
   * Try lightweight Ollama backend (Phi-3 Mini)
   */
  private async tryOllamaLight(): Promise<LightNLUService | null> {
    const service = new LightNLUService('mini'); // Phi-3 Mini
    
    // Test if Ollama is available
    try {
      const info = await service.getModelInfo();
      if (!info.available) {
        throw new Error('Ollama light model not available');
      }
      return service;
    } catch (error) {
      throw new Error(`Ollama light initialization failed: ${error.message}`);
    }
  }

  /**
   * Try full Ollama backend
   */
  private async tryOllamaFull(): Promise<NLUService | null> {
    const service = new NLUService();
    
    // Test if full model is available
    try {
      const info = await service.getModelInfo();
      if (!info.available) {
        throw new Error('Ollama full model not available');
      }
      return service;
    } catch (error) {
      throw new Error(`Ollama full initialization failed: ${error.message}`);
    }
  }

  /**
   * Wait for service initialization with timeout
   */
  private async waitForInitialization(service: any, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(async () => {
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Initialization timeout'));
          return;
        }

        try {
          const info = await service.getModelInfo();
          if (info.available) {
            clearInterval(checkInterval);
            resolve();
          }
        } catch (error) {
          // Continue checking
        }
      }, 100);
    });
  }

  /**
   * Parse command using the active service
   */
  async parseCommand(transcription: TranscriptionResult): Promise<Command> {
    const startTime = Date.now();
    
    try {
      let result;
      
      if (this.activeBackend === 'llamacpp') {
        const nluResult = await this.activeService.parseCommand(transcription);
        result = this.activeService.nluResultToCommand(nluResult, transcription);
      } else if (this.activeBackend === 'classification') {
        const nluResult = await this.activeService.parseCommand(transcription);
        result = this.activeService.nluResultToCommand(nluResult, transcription);
      } else {
        // Ollama services
        const nluResult = await this.activeService.parseCommand(transcription);
        result = this.activeService.nluResultToCommand(nluResult, transcription);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Update performance stats
      this.updatePerformanceStats(this.activeBackend, processingTime, true);
      
      // Check if we need to switch backends due to performance
      if (processingTime > this.config.maxInferenceTime!) {
        console.warn(`⚠️  Slow inference (${processingTime}ms), considering backend switch`);
        await this.considerBackendSwitch();
      }
      
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Update failure stats
      this.updatePerformanceStats(this.activeBackend, processingTime, false);
      
      console.error(`❌ NLU parsing failed with ${this.activeBackend}:`, error.message);
      
      // Try fallback to classification
      if (this.activeBackend !== 'classification') {
        console.log('🔄 Falling back to classification-based parsing...');
        return await this.fallbackToClassification(transcription);
      }
      
      throw error;
    }
  }

  /**
   * Fallback to classification-based parsing
   */
  private async fallbackToClassification(transcription: TranscriptionResult): Promise<Command> {
    const classificationService = new LightNLUService('classification');
    const nluResult = await classificationService.parseCommand(transcription);
    return classificationService.nluResultToCommand(nluResult, transcription);
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(backend: NLUBackend, time: number, success: boolean): void {
    const current = this.performanceStats.get(backend) || { avgTime: 0, successRate: 0 };
    
    // Exponential moving average for time
    current.avgTime = current.avgTime === 0 ? time : (current.avgTime * 0.9 + time * 0.1);
    
    // Exponential moving average for success rate
    const successValue = success ? 1 : 0;
    current.successRate = current.successRate === 0 ? successValue : (current.successRate * 0.9 + successValue * 0.1);
    
    this.performanceStats.set(backend, current);
  }

  /**
   * Consider switching backends based on performance
   */
  private async considerBackendSwitch(): Promise<void> {
    const currentStats = this.performanceStats.get(this.activeBackend);
    if (!currentStats) return;

    // Switch if current backend is consistently slow or unreliable
    if (currentStats.avgTime > this.config.maxInferenceTime! || currentStats.successRate < 0.8) {
      console.log('🔄 Performance degraded, attempting backend switch...');
      
      // Try faster alternatives
      const alternatives: NLUBackend[] = ['classification', 'ollama-light', 'llamacpp'];
      
      for (const alt of alternatives) {
        if (alt === this.activeBackend) continue;
        
        try {
          const service = await this.tryInitializeBackend(alt);
          if (service) {
            this.activeService = service;
            this.activeBackend = alt;
            console.log(`✅ Switched to ${alt} backend for better performance`);
            return;
          }
        } catch (error) {
          console.warn(`⚠️  Could not switch to ${alt}:`, error.message);
        }
      }
    }
  }

  /**
   * Run benchmark on backend
   */
  private async runBenchmark(backend: NLUBackend, service: any): Promise<void> {
    console.log(`📊 Benchmarking ${backend} backend...`);
    
    const testCommands = [
      "rat 5 cage 3 weight 280 grams",
      "change weight to 300 grams", 
      "move rat 7 to cage 12",
      "show rats around 250 grams",
      "stop listening"
    ];

    const times: number[] = [];
    let successes = 0;

    for (const cmd of testCommands) {
      try {
        const transcription = { text: cmd, confidence: 0.95, processingTime: 0 };
        const start = Date.now();
        
        if (backend === 'llamacpp') {
          await service.parseCommand(transcription);
        } else {
          await service.parseCommand(transcription);
        }
        
        const time = Date.now() - start;
        times.push(time);
        successes++;
        
      } catch (error) {
        console.warn(`Benchmark test failed: ${error.message}`);
      }
    }

    const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0;
    const successRate = successes / testCommands.length;
    
    console.log(`📈 ${backend} benchmark: ${avgTime}ms avg, ${Math.round(successRate * 100)}% success`);
    
    this.performanceStats.set(backend, { avgTime, successRate });
  }

  /**
   * Get comprehensive status of all backends
   */
  async getSystemStatus(): Promise<{
    activeBackend: NLUBackend;
    availableBackends: string[];
    performance: { [key: string]: { avgTime: number; successRate: number } };
    recommendations: string[];
  }> {
    const availableBackends: string[] = [];
    const recommendations: string[] = [];

    // Check each backend availability
    for (const backend of ['llamacpp', 'ollama-light', 'ollama-full', 'classification'] as NLUBackend[]) {
      try {
        await this.tryInitializeBackend(backend);
        availableBackends.push(backend);
      } catch (error) {
        // Backend not available
      }
    }

    // Generate recommendations
    if (!availableBackends.includes('llamacpp')) {
      recommendations.push('Install llama.cpp for fastest inference: make setup-llama-cpp');
    }
    
    if (!availableBackends.includes('ollama-light')) {
      recommendations.push('Install lightweight Ollama model: make setup-light-model');
    }

    const performance: { [key: string]: { avgTime: number; successRate: number } } = {};
    for (const [backend, stats] of this.performanceStats) {
      performance[backend] = stats;
    }

    return {
      activeBackend: this.activeBackend,
      availableBackends,
      performance,
      recommendations
    };
  }

  /**
   * Force switch to specific backend
   */
  async switchBackend(backend: NLUBackend): Promise<boolean> {
    try {
      const service = await this.tryInitializeBackend(backend);
      if (service) {
        this.activeService = service;
        this.activeBackend = backend;
        console.log(`✅ Manually switched to ${backend} backend`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to switch to ${backend}:`, error.message);
      return false;
    }
  }

  /**
   * Get current backend info
   */
  getCurrentBackend(): { backend: NLUBackend; stats?: { avgTime: number; successRate: number } } {
    return {
      backend: this.activeBackend,
      stats: this.performanceStats.get(this.activeBackend)
    };
  }
}