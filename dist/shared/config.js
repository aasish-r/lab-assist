"use strict";
/**
 * Application Configuration
 * Centralized configuration for AI backends and other settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_MODEL_INFO = exports.CONFIG_PRESETS = exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
// Default configuration prioritizes minimal footprint
exports.DEFAULT_CONFIG = {
    ai: {
        preferredBackend: 'classification', // Fastest, no download needed (0 MB)
        maxInferenceTime: 1000,
        enableBenchmarking: true,
        fallbackOrder: [
            'classification', // 0 MB - Pattern matching, ultra-fast
            'ollama-tiny', // 637 MB - TinyLlama model via Ollama  
            'ollama-light', // 2.3 GB - Phi-3 Mini via Ollama
            'ollama-full', // 4+ GB - Larger models via Ollama
            'llamacpp' // Variable - Requires manual GGUF setup
        ]
    },
    database: {
        enabled: true
    },
    speech: {
        enabled: true
    }
};
// Configuration presets for different use cases
exports.CONFIG_PRESETS = {
    minimal: {
        ...exports.DEFAULT_CONFIG,
        ai: {
            ...exports.DEFAULT_CONFIG.ai,
            preferredBackend: 'classification',
            enableBenchmarking: false
        }
    },
    tiny: {
        ...exports.DEFAULT_CONFIG,
        ai: {
            ...exports.DEFAULT_CONFIG.ai,
            preferredBackend: 'ollama-tiny'
        }
    },
    balanced: {
        ...exports.DEFAULT_CONFIG,
        ai: {
            ...exports.DEFAULT_CONFIG.ai,
            preferredBackend: 'ollama-light'
        }
    },
    performance: {
        ...exports.DEFAULT_CONFIG,
        ai: {
            ...exports.DEFAULT_CONFIG.ai,
            preferredBackend: 'llamacpp',
            fallbackOrder: ['llamacpp', 'ollama-full', 'ollama-light', 'ollama-tiny', 'classification']
        }
    }
};
/**
 * Load configuration from environment or return default
 */
function loadConfig() {
    const envBackend = process.env.LAB_ASSIST_AI_BACKEND;
    const preset = process.env.LAB_ASSIST_PRESET;
    if (preset && exports.CONFIG_PRESETS[preset]) {
        return exports.CONFIG_PRESETS[preset];
    }
    if (envBackend) {
        return {
            ...exports.DEFAULT_CONFIG,
            ai: {
                ...exports.DEFAULT_CONFIG.ai,
                preferredBackend: envBackend
            }
        };
    }
    return exports.DEFAULT_CONFIG;
}
/**
 * Get AI model size information
 */
exports.AI_MODEL_INFO = {
    'classification': {
        name: 'Pattern Matching',
        size: '0 MB',
        description: 'Ultra-fast pattern-based parsing, no AI model needed',
        downloadNeeded: false
    },
    'ollama-tiny': {
        name: 'TinyLlama 1.1B',
        size: '637 MB',
        description: 'Smallest AI model, good for basic commands',
        downloadNeeded: true,
        setupCommand: 'make quick-tiny'
    },
    'ollama-light': {
        name: 'Phi-3 Mini',
        size: '2.3 GB',
        description: 'Balanced model, good accuracy vs size',
        downloadNeeded: true,
        setupCommand: 'make quick-light'
    },
    'ollama-full': {
        name: 'Larger Models',
        size: '4+ GB',
        description: 'High accuracy models for complex parsing',
        downloadNeeded: true,
        setupCommand: 'make install'
    },
    'llamacpp': {
        name: 'llama.cpp GGUF',
        size: 'Variable',
        description: 'Maximum performance with GGUF models',
        downloadNeeded: true,
        setupCommand: 'make setup-llama-cpp'
    }
};
