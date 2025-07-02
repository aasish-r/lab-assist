/**
 * Lab Assist Application Configuration
 * Centralized configuration for all models, timeouts, paths, and settings
 */

import * as path from 'path';
import * as os from 'os';

export type AIBackend = 'classification' | 'ollama-tiny' | 'ollama-light' | 'ollama-full' | 'llamacpp';

// ===== AI MODEL CONFIGURATIONS =====
export const AI_MODELS = {
  // Ollama Models
  OLLAMA_TINY: 'tinyllama:1.1b',      // 637MB - Default
  OLLAMA_LIGHT: 'phi3:mini',          // 2.3GB
  OLLAMA_FULL: 'llama3.2:3b',         // 2GB+
  
  // Whisper Models
  WHISPER_BASE: 'ggml-base.en.bin',   // ~142MB
  WHISPER_TINY: 'ggml-tiny.en.bin',   // ~39MB
  
  // llama.cpp Models
  LLAMACPP_DEFAULT: 'phi-3-mini-4k-instruct.Q4_K_M.gguf',
  LLAMACPP_TINY: 'phi-3-mini-4k-instruct.Q2_K.gguf'
} as const;

// ===== TIMEOUT CONFIGURATIONS =====
export const TIMEOUTS = {
  // AI Inference timeouts (milliseconds)
  AI_INFERENCE_DEFAULT: 1000,
  AI_INFERENCE_MAX: 2000,
  AI_INFERENCE_FAST: 500,
  
  // Speech processing timeouts
  SPEECH_PROCESSING: 5000,
  SPEECH_MODEL_LOAD: 10000,
  
  // Database timeouts
  DATABASE_INIT: 5000,
  DATABASE_QUERY: 1000,
  
  // Benchmark timeouts
  BENCHMARK_TIMEOUT: 3000,
  
  // Service initialization timeouts
  SERVICE_INIT: 10000
} as const;

// ===== PATH CONFIGURATIONS =====
export const PATHS = {
  // Model directories
  MODELS_DIR: path.join(process.cwd(), 'models'),
  WHISPER_MODELS_DIR: path.join(process.cwd(), 'models'),
  LLAMACPP_MODELS_DIR: path.join(process.cwd(), 'models'),
  
  // Temporary directories
  TEMP_AUDIO_DIR: path.join(os.tmpdir(), 'lab-assist-audio'),
  TEMP_DIR: path.join(os.tmpdir(), 'lab-assist'),
  
  // Database paths
  DATABASE_NAME: 'lab-assist.db',
  
  // Asset paths
  ICON_PATH: path.join(process.cwd(), 'assets', 'icon.png'),
  
  // Configuration files
  CONFIG_DIR: path.join(os.homedir(), '.lab-assist'),
  USER_CONFIG: path.join(os.homedir(), '.lab-assist', 'config.json')
} as const;

// ===== AI BACKEND CONFIGURATIONS =====
export const BACKEND_CONFIG = {
  classification: {
    name: 'Pattern Matching',
    size: '0 MB',
    description: 'Ultra-fast pattern-based parsing, no AI model needed',
    downloadNeeded: false,
    setupCommand: null,
    modelName: null,
    inferenceTimeout: TIMEOUTS.AI_INFERENCE_FAST
  },
  'ollama-tiny': {
    name: 'TinyLlama 1.1B',
    size: '637 MB', 
    description: 'Smallest AI model, good for basic commands',
    downloadNeeded: true,
    setupCommand: 'make quick-tiny',
    modelName: AI_MODELS.OLLAMA_TINY,
    inferenceTimeout: TIMEOUTS.AI_INFERENCE_DEFAULT
  },
  'ollama-light': {
    name: 'Phi-3 Mini',
    size: '2.3 GB',
    description: 'Balanced model, good accuracy vs size',
    downloadNeeded: true,
    setupCommand: 'make quick-light',
    modelName: AI_MODELS.OLLAMA_LIGHT,
    inferenceTimeout: TIMEOUTS.AI_INFERENCE_DEFAULT
  },
  'ollama-full': {
    name: 'Larger Models',
    size: '4+ GB',
    description: 'High accuracy models for complex parsing',
    downloadNeeded: true,
    setupCommand: 'make install',
    modelName: AI_MODELS.OLLAMA_FULL,
    inferenceTimeout: TIMEOUTS.AI_INFERENCE_MAX
  },
  'llamacpp': {
    name: 'llama.cpp GGUF',
    size: 'Variable',
    description: 'Maximum performance with GGUF models',
    downloadNeeded: true,
    setupCommand: 'make setup-llama-cpp',
    modelName: AI_MODELS.LLAMACPP_DEFAULT,
    inferenceTimeout: TIMEOUTS.AI_INFERENCE_FAST
  }
} as const;

// ===== MAIN APPLICATION CONFIGURATION =====
export interface AppConfig {
  ai: {
    preferredBackend: AIBackend;
    maxInferenceTime: number;
    enableBenchmarking: boolean;
    fallbackOrder: AIBackend[];
    confidenceThreshold: number;
  };
  database: {
    enabled: boolean;
    path?: string;
    pragmas: {
      foreignKeys: boolean;
      journalMode: 'WAL' | 'DELETE' | 'MEMORY';
      synchronous: 'NORMAL' | 'FULL' | 'OFF';
    };
  };
  speech: {
    enabled: boolean;
    modelPath?: string;
    modelName: string;
    sampleRate: number;
    chunkSize: number;
  };
  ui: {
    window: {
      width: number;
      height: number;
      minWidth: number;
      minHeight: number;
    };
    theme: 'light' | 'dark' | 'auto';
  };
}

// ===== DEFAULT CONFIGURATION =====
export const DEFAULT_CONFIG: AppConfig = {
  ai: {
    preferredBackend: 'ollama-tiny', // Changed to TinyLlama as default
    maxInferenceTime: TIMEOUTS.AI_INFERENCE_DEFAULT,
    enableBenchmarking: true,
    fallbackOrder: [
      'ollama-tiny',     // TinyLlama 637MB - New default
      'classification',  // Pattern matching, 0MB
      'ollama-light',    // Phi-3 Mini 2.3GB
      'ollama-full',     // Larger models 4GB+
      'llamacpp'         // Manual setup
    ],
    confidenceThreshold: 0.7
  },
  database: {
    enabled: true, // Enabled for lab assistant functionality
    pragmas: {
      foreignKeys: true,
      journalMode: 'WAL',
      synchronous: 'NORMAL'
    }
  },
  speech: {
    enabled: true,
    modelName: AI_MODELS.WHISPER_BASE,
    sampleRate: 16000,
    chunkSize: 1024
  },
  ui: {
    window: {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600
    },
    theme: 'auto'
  }
};

// ===== CONFIGURATION PRESETS =====
export const CONFIG_PRESETS = {
  minimal: {
    ...DEFAULT_CONFIG,
    ai: {
      ...DEFAULT_CONFIG.ai,
      preferredBackend: 'classification' as AIBackend,
      enableBenchmarking: false
    }
  },
  
  tiny: {
    ...DEFAULT_CONFIG,
    ai: {
      ...DEFAULT_CONFIG.ai,
      preferredBackend: 'ollama-tiny' as AIBackend
    }
  },
  
  balanced: {
    ...DEFAULT_CONFIG,
    ai: {
      ...DEFAULT_CONFIG.ai,
      preferredBackend: 'ollama-light' as AIBackend
    }
  },
  
  performance: {
    ...DEFAULT_CONFIG,
    ai: {
      ...DEFAULT_CONFIG.ai,
      preferredBackend: 'llamacpp' as AIBackend,
      fallbackOrder: ['llamacpp', 'ollama-full', 'ollama-light', 'ollama-tiny', 'classification'] as AIBackend[]
    }
  }
};

// ===== ENVIRONMENT VARIABLE MAPPINGS =====
export const ENV_MAPPINGS = {
  LAB_ASSIST_AI_BACKEND: 'ai.preferredBackend',
  LAB_ASSIST_PRESET: 'preset',
  LAB_ASSIST_MAX_INFERENCE_TIME: 'ai.maxInferenceTime',
  LAB_ASSIST_ENABLE_BENCHMARKING: 'ai.enableBenchmarking',
  LAB_ASSIST_DATABASE_ENABLED: 'database.enabled',
  LAB_ASSIST_SPEECH_ENABLED: 'speech.enabled',
  LAB_ASSIST_THEME: 'ui.theme'
} as const;

// ===== CONFIGURATION LOADER =====
export function loadConfig(): AppConfig {
  // Start with default config
  let config = { ...DEFAULT_CONFIG };
  
  // Check for preset first
  const preset = process.env.LAB_ASSIST_PRESET as keyof typeof CONFIG_PRESETS;
  if (preset && CONFIG_PRESETS[preset]) {
    config = { ...CONFIG_PRESETS[preset] };
  }
  
  // Apply individual environment overrides
  const envBackend = process.env.LAB_ASSIST_AI_BACKEND as AIBackend;
  if (envBackend && BACKEND_CONFIG[envBackend]) {
    config.ai.preferredBackend = envBackend;
  }
  
  const maxInferenceTime = process.env.LAB_ASSIST_MAX_INFERENCE_TIME;
  if (maxInferenceTime && !isNaN(Number(maxInferenceTime))) {
    config.ai.maxInferenceTime = Number(maxInferenceTime);
  }
  
  const enableBenchmarking = process.env.LAB_ASSIST_ENABLE_BENCHMARKING;
  if (enableBenchmarking) {
    config.ai.enableBenchmarking = enableBenchmarking.toLowerCase() === 'true';
  }
  
  const databaseEnabled = process.env.LAB_ASSIST_DATABASE_ENABLED;
  if (databaseEnabled) {
    config.database.enabled = databaseEnabled.toLowerCase() === 'true';
  }
  
  const speechEnabled = process.env.LAB_ASSIST_SPEECH_ENABLED;
  if (speechEnabled) {
    config.speech.enabled = speechEnabled.toLowerCase() === 'true';
  }
  
  const theme = process.env.LAB_ASSIST_THEME as 'light' | 'dark' | 'auto';
  if (theme && ['light', 'dark', 'auto'].includes(theme)) {
    config.ui.theme = theme;
  }
  
  return config;
}

// ===== HELPER FUNCTIONS =====
export function getModelPath(modelName: string): string {
  return path.join(PATHS.MODELS_DIR, modelName);
}

export function getWhisperModelPath(modelName?: string): string {
  const model = modelName || AI_MODELS.WHISPER_BASE;
  return path.join(PATHS.WHISPER_MODELS_DIR, model);
}

export function getLlamaCppModelPath(modelName?: string): string {
  const model = modelName || AI_MODELS.LLAMACPP_DEFAULT;
  return path.join(PATHS.LLAMACPP_MODELS_DIR, model);
}

export function getDatabasePath(): string {
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'dev-data', PATHS.DATABASE_NAME);
  }
  
  // In production, use user data directory
  const { app } = require('electron');
  if (app) {
    return path.join(app.getPath('userData'), PATHS.DATABASE_NAME);
  }
  
  // Fallback for testing
  return path.join(PATHS.TEMP_DIR, PATHS.DATABASE_NAME);
}

export function getBackendConfig(backend: AIBackend) {
  return BACKEND_CONFIG[backend];
}

export function getModelForBackend(backend: AIBackend): string | null {
  return BACKEND_CONFIG[backend].modelName;
}

export function getTimeoutForBackend(backend: AIBackend): number {
  return BACKEND_CONFIG[backend].inferenceTimeout;
}

// ===== CONFIGURATION VALIDATION =====
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate AI backend
  if (!BACKEND_CONFIG[config.ai.preferredBackend]) {
    errors.push(`Invalid AI backend: ${config.ai.preferredBackend}`);
  }
  
  // Validate inference timeout
  if (config.ai.maxInferenceTime < 100 || config.ai.maxInferenceTime > 30000) {
    errors.push(`Invalid inference timeout: ${config.ai.maxInferenceTime}ms (must be 100-30000ms)`);
  }
  
  // Validate confidence threshold
  if (config.ai.confidenceThreshold < 0 || config.ai.confidenceThreshold > 1) {
    errors.push(`Invalid confidence threshold: ${config.ai.confidenceThreshold} (must be 0-1)`);
  }
  
  // Validate fallback order
  for (const backend of config.ai.fallbackOrder) {
    if (!BACKEND_CONFIG[backend]) {
      errors.push(`Invalid backend in fallback order: ${backend}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}