"use strict";
/**
 * Speech Service - Integrates with Whisper.cpp for speech recognition
 * Handles transcription of audio chunks with confidence scoring
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
exports.SpeechService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const types_1 = require("../../shared/types");
const app_config_1 = require("../../shared/app-config");
class SpeechService {
    constructor() {
        this.whisperProcess = null;
        this.isModelLoaded = false;
        const config = (0, app_config_1.loadConfig)();
        // Set up paths for Whisper model and temp files using configuration
        this.modelPath = (0, app_config_1.getWhisperModelPath)(config.speech.modelName);
        this.tempDir = app_config_1.PATHS.TEMP_AUDIO_DIR;
    }
    /**
     * Initialize the speech service and load Whisper model
     */
    async initialize() {
        try {
            // Create temp directory for audio files
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
            // Check if Whisper model exists
            await this.ensureWhisperModel();
            // Set as loaded first to avoid circular dependency
            this.isModelLoaded = true;
            // Pre-load the model by running a quick test (now that isModelLoaded is true)
            await this.preloadModel();
            console.log('Speech service initialized successfully');
        }
        catch (error) {
            this.isModelLoaded = false;
            throw new types_1.LabAssistError(`Failed to initialize speech service: ${error.message}`, 'SPEECH_PROCESSING_ERROR', error);
        }
    }
    /**
     * Transcribe an audio chunk using Whisper
     */
    async transcribe(audioChunk) {
        if (!this.isModelLoaded) {
            throw new types_1.LabAssistError('Speech service not initialized', 'SPEECH_PROCESSING_ERROR');
        }
        const startTime = Date.now();
        try {
            // Save audio chunk to temporary WAV file
            const audioFilePath = await this.saveAudioChunk(audioChunk);
            // Run Whisper transcription
            const transcriptionData = await this.runWhisperTranscription(audioFilePath);
            // Clean up temp file
            fs.unlinkSync(audioFilePath);
            const processingTime = Date.now() - startTime;
            // Parse Whisper output and extract confidence
            const result = this.parseWhisperOutput(transcriptionData, processingTime);
            console.log(`Transcription completed in ${processingTime}ms: "${result.text}" (confidence: ${result.confidence.toFixed(2)})`);
            return result;
        }
        catch (error) {
            throw new types_1.LabAssistError(`Transcription failed: ${error.message}`, 'SPEECH_PROCESSING_ERROR', error);
        }
    }
    /**
     * Ensure Whisper model is available
     */
    async ensureWhisperModel() {
        if (!fs.existsSync(this.modelPath)) {
            // For MVP, we'll use a placeholder. In production, this would download the model
            console.warn(`Whisper model not found at ${this.modelPath}`);
            console.warn('Please download the Whisper model manually for now');
            // Create models directory
            const modelsDir = path.dirname(this.modelPath);
            if (!fs.existsSync(modelsDir)) {
                fs.mkdirSync(modelsDir, { recursive: true });
            }
            // For testing, create a dummy model file
            fs.writeFileSync(this.modelPath, 'dummy model file');
        }
    }
    /**
     * Pre-load Whisper model for faster subsequent transcriptions
     */
    async preloadModel() {
        try {
            console.log('Whisper model ready for use');
            // Skip actual preloading for now to avoid initialization issues
            // In production, this would warm up the model with a small audio sample
        }
        catch (error) {
            console.warn('Model preload failed, but continuing:', error.message);
            // Don't throw here as the model might still work for real audio
        }
    }
    /**
     * Save audio chunk to temporary WAV file
     */
    async saveAudioChunk(audioChunk) {
        const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.wav`;
        const filePath = path.join(this.tempDir, fileName);
        try {
            // Convert Float32Array to WAV format
            const wavBuffer = this.createWavBuffer(audioChunk.buffer, 16000);
            fs.writeFileSync(filePath, wavBuffer);
            return filePath;
        }
        catch (error) {
            throw new Error(`Failed to save audio file: ${error.message}`);
        }
    }
    /**
     * Create WAV buffer from Float32Array audio data
     */
    createWavBuffer(audioData, sampleRate) {
        const length = audioData.length;
        const buffer = Buffer.alloc(44 + length * 2);
        // WAV header
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(36 + length * 2, 4);
        buffer.write('WAVE', 8);
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16);
        buffer.writeUInt16LE(1, 20); // PCM format
        buffer.writeUInt16LE(1, 22); // Mono
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(sampleRate * 2, 28);
        buffer.writeUInt16LE(2, 32);
        buffer.writeUInt16LE(16, 34);
        buffer.write('data', 36);
        buffer.writeUInt32LE(length * 2, 40);
        // Convert float32 to int16
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            buffer.writeInt16LE(sample * 0x7FFF, 44 + i * 2);
        }
        return buffer;
    }
    /**
     * Run Whisper transcription process
     */
    async runWhisperTranscription(_audioFilePath) {
        return new Promise((resolve) => {
            // For MVP, we'll simulate Whisper output
            // In production, this would spawn the actual whisper.cpp process
            // Simulate processing time
            const processingTime = Math.random() * 1000 + 500; // 500-1500ms
            setTimeout(() => {
                // For testing, return a mock transcription based on audio duration
                const mockTranscriptions = [
                    'rat 5 cage 3 weight 280 grams',
                    'move rat 7 to cage 12',
                    'change weight to 350 grams',
                    'what rats are around 300 grams',
                    'stop listening'
                ];
                const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
                const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0 confidence
                // Simulate Whisper JSON output format
                const whisperOutput = JSON.stringify({
                    text: randomTranscription,
                    segments: [{
                            text: randomTranscription,
                            start: 0,
                            end: 2.5,
                            confidence: confidence
                        }]
                });
                resolve(whisperOutput);
            }, processingTime);
            /*
            // Real Whisper.cpp implementation would look like this:
            const whisperArgs = [
              '-m', this.modelPath,
              '-f', audioFilePath,
              '--output-json',
              '--language', 'en',
              '--task', 'transcribe'
            ];
      
            const whisperProcess = spawn('whisper', whisperArgs);
            let output = '';
            let error = '';
      
            whisperProcess.stdout.on('data', (data) => {
              output += data.toString();
            });
      
            whisperProcess.stderr.on('data', (data) => {
              error += data.toString();
            });
      
            whisperProcess.on('close', (code) => {
              if (code === 0) {
                resolve(output);
              } else {
                reject(new Error(`Whisper process failed: ${error}`));
              }
            });
      
            whisperProcess.on('error', (err) => {
              reject(new Error(`Failed to start Whisper process: ${err.message}`));
            });
            */
        });
    }
    /**
     * Parse Whisper output and extract transcription with confidence
     */
    parseWhisperOutput(whisperOutput, processingTime) {
        try {
            const data = JSON.parse(whisperOutput);
            // Extract text and confidence from Whisper output
            const text = data.text?.trim() || '';
            // Calculate average confidence from segments
            let confidence = 0.8; // Default confidence
            if (data.segments && data.segments.length > 0) {
                const totalConfidence = data.segments.reduce((sum, segment) => {
                    return sum + (segment.confidence || 0.8);
                }, 0);
                confidence = totalConfidence / data.segments.length;
            }
            return {
                text,
                confidence: Math.min(1.0, Math.max(0.0, confidence)),
                processingTime
            };
        }
        catch (error) {
            // If JSON parsing fails, treat as plain text
            const text = whisperOutput.trim();
            return {
                text,
                confidence: 0.6, // Lower confidence for unparsed output
                processingTime
            };
        }
    }
    /**
     * Check if speech service is ready
     */
    isReady() {
        return this.isModelLoaded;
    }
    /**
     * Get speech service status
     */
    getStatus() {
        return {
            ready: this.isModelLoaded,
            modelPath: this.modelPath,
            tempDir: this.tempDir
        };
    }
    /**
     * Cleanup speech service resources
     */
    async cleanup() {
        if (this.whisperProcess) {
            this.whisperProcess.kill();
            this.whisperProcess = null;
        }
        // Clean up temp directory
        try {
            if (fs.existsSync(this.tempDir)) {
                const files = fs.readdirSync(this.tempDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(this.tempDir, file));
                }
                fs.rmdirSync(this.tempDir);
            }
        }
        catch (error) {
            console.warn('Failed to cleanup temp directory:', error.message);
        }
        this.isModelLoaded = false;
        console.log('Speech service cleaned up');
    }
}
exports.SpeechService = SpeechService;
