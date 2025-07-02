"use strict";
/**
 * Lab Assist Application Configuration
 * Centralized configuration for all models, timeouts, paths, and settings
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
exports.ENV_MAPPINGS = exports.CONFIG_PRESETS = exports.DEFAULT_CONFIG = exports.BACKEND_CONFIG = exports.PATHS = exports.TIMEOUTS = exports.AI_MODELS = void 0;
exports.loadConfig = loadConfig;
exports.getModelPath = getModelPath;
exports.getWhisperModelPath = getWhisperModelPath;
exports.getLlamaCppModelPath = getLlamaCppModelPath;
exports.getDatabasePath = getDatabasePath;
exports.getBackendConfig = getBackendConfig;
exports.getModelForBackend = getModelForBackend;
exports.getTimeoutForBackend = getTimeoutForBackend;
exports.validateConfig = validateConfig;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// ===== AI MODEL CONFIGURATIONS =====
exports.AI_MODELS = {
    // Ollama Models
    OLLAMA_TINY: 'tinyllama:1.1b', // 637MB - Default
    OLLAMA_LIGHT: 'phi3:mini', // 2.3GB
    OLLAMA_FULL: 'llama3.2:3b', // 2GB+
    // Whisper Models
    WHISPER_BASE: 'ggml-base.en.bin', // ~142MB
    WHISPER_TINY: 'ggml-tiny.en.bin', // ~39MB
    // llama.cpp Models
    LLAMACPP_DEFAULT: 'phi-3-mini-4k-instruct.Q4_K_M.gguf',
    LLAMACPP_TINY: 'phi-3-mini-4k-instruct.Q2_K.gguf'
};
// ===== TIMEOUT CONFIGURATIONS =====
exports.TIMEOUTS = {
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
};
// ===== PATH CONFIGURATIONS =====
exports.PATHS = {
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
};
// ===== AI BACKEND CONFIGURATIONS =====
exports.BACKEND_CONFIG = {
    classification: {
        name: 'Pattern Matching',
        size: '0 MB',
        description: 'Ultra-fast pattern-based parsing, no AI model needed',
        downloadNeeded: false,
        setupCommand: null,
        modelName: null,
        inferenceTimeout: exports.TIMEOUTS.AI_INFERENCE_FAST
    },
    'ollama-tiny': {
        name: 'TinyLlama 1.1B',
        size: '637 MB',
        description: 'Smallest AI model, good for basic commands',
        downloadNeeded: true,
        setupCommand: 'make quick-tiny',
        modelName: exports.AI_MODELS.OLLAMA_TINY,
        inferenceTimeout: exports.TIMEOUTS.AI_INFERENCE_DEFAULT
    },
    'ollama-light': {
        name: 'Phi-3 Mini',
        size: '2.3 GB',
        description: 'Balanced model, good accuracy vs size',
        downloadNeeded: true,
        setupCommand: 'make quick-light',
        modelName: exports.AI_MODELS.OLLAMA_LIGHT,
        inferenceTimeout: exports.TIMEOUTS.AI_INFERENCE_DEFAULT
    },
    'ollama-full': {
        name: 'Larger Models',
        size: '4+ GB',
        description: 'High accuracy models for complex parsing',
        downloadNeeded: true,
        setupCommand: 'make install',
        modelName: exports.AI_MODELS.OLLAMA_FULL,
        inferenceTimeout: exports.TIMEOUTS.AI_INFERENCE_MAX
    },
    'llamacpp': {
        name: 'llama.cpp GGUF',
        size: 'Variable',
        description: 'Maximum performance with GGUF models',
        downloadNeeded: true,
        setupCommand: 'make setup-llama-cpp',
        modelName: exports.AI_MODELS.LLAMACPP_DEFAULT,
        inferenceTimeout: exports.TIMEOUTS.AI_INFERENCE_FAST
    }
};
// ===== DEFAULT CONFIGURATION =====
exports.DEFAULT_CONFIG = {
    ai: {
        preferredBackend: 'ollama-tiny', // Changed to TinyLlama as default
        maxInferenceTime: exports.TIMEOUTS.AI_INFERENCE_DEFAULT,
        enableBenchmarking: true,
        fallbackOrder: [
            'ollama-tiny', // TinyLlama 637MB - New default
            'classification', // Pattern matching, 0MB
            'ollama-light', // Phi-3 Mini 2.3GB
            'ollama-full', // Larger models 4GB+
            'llamacpp' // Manual setup
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
        modelName: exports.AI_MODELS.WHISPER_BASE,
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
// ===== ENVIRONMENT VARIABLE MAPPINGS =====
exports.ENV_MAPPINGS = {
    LAB_ASSIST_AI_BACKEND: 'ai.preferredBackend',
    LAB_ASSIST_PRESET: 'preset',
    LAB_ASSIST_MAX_INFERENCE_TIME: 'ai.maxInferenceTime',
    LAB_ASSIST_ENABLE_BENCHMARKING: 'ai.enableBenchmarking',
    LAB_ASSIST_DATABASE_ENABLED: 'database.enabled',
    LAB_ASSIST_SPEECH_ENABLED: 'speech.enabled',
    LAB_ASSIST_THEME: 'ui.theme'
};
// ===== CONFIGURATION LOADER =====
function loadConfig() {
    // Start with default config
    let config = { ...exports.DEFAULT_CONFIG };
    // Check for preset first
    const preset = process.env.LAB_ASSIST_PRESET;
    if (preset && exports.CONFIG_PRESETS[preset]) {
        config = { ...exports.CONFIG_PRESETS[preset] };
    }
    // Apply individual environment overrides
    const envBackend = process.env.LAB_ASSIST_AI_BACKEND;
    if (envBackend && exports.BACKEND_CONFIG[envBackend]) {
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
    const theme = process.env.LAB_ASSIST_THEME;
    if (theme && ['light', 'dark', 'auto'].includes(theme)) {
        config.ui.theme = theme;
    }
    return config;
}
// ===== HELPER FUNCTIONS =====
function getModelPath(modelName) {
    return path.join(exports.PATHS.MODELS_DIR, modelName);
}
function getWhisperModelPath(modelName) {
    const model = modelName || exports.AI_MODELS.WHISPER_BASE;
    return path.join(exports.PATHS.WHISPER_MODELS_DIR, model);
}
function getLlamaCppModelPath(modelName) {
    const model = modelName || exports.AI_MODELS.LLAMACPP_DEFAULT;
    return path.join(exports.PATHS.LLAMACPP_MODELS_DIR, model);
}
function getDatabasePath() {
    if (process.env.NODE_ENV === 'development') {
        return path.join(process.cwd(), 'dev-data', exports.PATHS.DATABASE_NAME);
    }
    // In production, use user data directory
    const { app } = require('electron');
    if (app) {
        return path.join(app.getPath('userData'), exports.PATHS.DATABASE_NAME);
    }
    // Fallback for testing
    return path.join(exports.PATHS.TEMP_DIR, exports.PATHS.DATABASE_NAME);
}
function getBackendConfig(backend) {
    return exports.BACKEND_CONFIG[backend];
}
function getModelForBackend(backend) {
    return exports.BACKEND_CONFIG[backend].modelName;
}
function getTimeoutForBackend(backend) {
    return exports.BACKEND_CONFIG[backend].inferenceTimeout;
}
// ===== CONFIGURATION VALIDATION =====
function validateConfig(config) {
    const errors = [];
    // Validate AI backend
    if (!exports.BACKEND_CONFIG[config.ai.preferredBackend]) {
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
        if (!exports.BACKEND_CONFIG[backend]) {
            errors.push(`Invalid backend in fallback order: ${backend}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
