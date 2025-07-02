/**
 * Audio Manager - Handles continuous audio recording and silence detection
 * Manages microphone input and provides audio chunks for speech processing
 */

import { EventEmitter } from 'events';
import { AudioChunk } from '../../shared/types';

export class AudioManager extends EventEmitter {
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  
  // Audio processing parameters
  private readonly SAMPLE_RATE = 16000; // Whisper prefers 16kHz
  private readonly SILENCE_THRESHOLD = 0.01; // Adjust based on environment
  private readonly SILENCE_DURATION = 1500; // 1.5 seconds of silence
  private readonly MAX_RECORDING_DURATION = 30000; // 30 seconds max per chunk
  
  // State tracking
  private audioBuffer: Float32Array[] = [];
  private lastSoundTime: number = 0;
  private recordingStartTime: number = 0;
  private silenceTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize audio system and request microphone permissions
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
      
      // Create analyser for volume detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create script processor for audio data
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      // Connect audio nodes
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Setup audio processing
      this.processor.onaudioprocess = (event) => {
        if (this.isRecording) {
          this.processAudioData(event.inputBuffer);
        }
      };

      console.log('Audio system initialized successfully');
      
    } catch (error) {
      throw new Error(`Failed to initialize audio: ${error.message}`);
    }
  }

  /**
   * Start continuous audio recording
   */
  async startListening(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Audio system not initialized');
    }

    if (this.isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isRecording = true;
      this.audioBuffer = [];
      this.recordingStartTime = Date.now();
      this.lastSoundTime = Date.now();

      this.emit('statusUpdate', { isListening: true, level: 0 });
      console.log('Started listening for audio');

    } catch (error) {
      this.isRecording = false;
      throw new Error(`Failed to start listening: ${error.message}`);
    }
  }

  /**
   * Stop audio recording
   */
  stopListening(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;
    
    // Clear any pending silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // Process any remaining audio in buffer
    if (this.audioBuffer.length > 0) {
      this.emitAudioChunk();
    }

    this.emit('statusUpdate', { isListening: false, level: 0 });
    console.log('Stopped listening for audio');
  }

  /**
   * Process incoming audio data
   */
  private processAudioData(inputBuffer: AudioBuffer): void {
    if (!this.analyser) return;

    // Get audio data
    const audioData = inputBuffer.getChannelData(0);
    
    // Calculate volume level
    const volume = this.calculateVolume(audioData);
    
    // Emit status update with volume level
    this.emit('statusUpdate', { isListening: this.isRecording, level: volume });

    // Check if there's sound above threshold
    const hasSound = volume > this.SILENCE_THRESHOLD;
    const currentTime = Date.now();

    if (hasSound) {
      this.lastSoundTime = currentTime;
      
      // Clear any existing silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    }

    // Add audio data to buffer
    this.audioBuffer.push(new Float32Array(audioData));

    // Check for silence duration or max recording time
    const timeSinceLastSound = currentTime - this.lastSoundTime;
    const totalRecordingTime = currentTime - this.recordingStartTime;

    if (timeSinceLastSound >= this.SILENCE_DURATION || totalRecordingTime >= this.MAX_RECORDING_DURATION) {
      // Only process if we have some audio content
      if (this.audioBuffer.length > 0 && this.hasAudioContent()) {
        this.emitAudioChunk();
      }
      this.resetBuffer();
    }
  }

  /**
   * Calculate RMS volume of audio data
   */
  private calculateVolume(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Check if buffer contains meaningful audio content
   */
  private hasAudioContent(): boolean {
    // Simple check - look for audio data above noise floor
    for (const chunk of this.audioBuffer) {
      const volume = this.calculateVolume(chunk);
      if (volume > this.SILENCE_THRESHOLD * 2) { // 2x threshold for content detection
        return true;
      }
    }
    return false;
  }

  /**
   * Emit audio chunk for processing
   */
  private emitAudioChunk(): void {
    if (this.audioBuffer.length === 0) return;

    // Combine all audio chunks into single array
    const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedAudio = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of this.audioBuffer) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Create audio chunk object
    const audioChunk: AudioChunk = {
      buffer: combinedAudio,
      timestamp: Date.now(),
      duration: totalLength / this.SAMPLE_RATE * 1000 // Convert to milliseconds
    };

    console.log(`Emitting audio chunk: ${audioChunk.duration.toFixed(0)}ms, ${combinedAudio.length} samples`);
    this.emit('audioChunk', audioChunk);
  }

  /**
   * Reset audio buffer and timers
   */
  private resetBuffer(): void {
    this.audioBuffer = [];
    this.recordingStartTime = Date.now();
    this.lastSoundTime = Date.now();
  }

  /**
   * Get current audio input level
   */
  getCurrentLevel(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate average level
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    return sum / dataArray.length / 255; // Normalize to 0-1
  }

  /**
   * Get available audio input devices
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  /**
   * Switch to a different audio input device
   */
  async switchAudioDevice(deviceId: string): Promise<void> {
    const wasRecording = this.isRecording;
    
    // Stop current recording
    if (wasRecording) {
      this.stopListening();
    }

    // Clean up current stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    try {
      // Get new stream with specified device
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          sampleRate: this.SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Reconnect audio nodes
      if (this.audioContext && this.analyser && this.processor) {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.analyser);
      }

      // Resume recording if it was active
      if (wasRecording) {
        await this.startListening();
      }

      console.log(`Switched to audio device: ${deviceId}`);

    } catch (error) {
      throw new Error(`Failed to switch audio device: ${error.message}`);
    }
  }

  /**
   * Cleanup audio resources
   */
  async cleanup(): Promise<void> {
    this.stopListening();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.processor = null;
    this.audioBuffer = [];

    console.log('Audio system cleaned up');
  }
}