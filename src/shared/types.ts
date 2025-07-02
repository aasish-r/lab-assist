/**
 * Shared type definitions for Lab Assist application
 * Used across main and renderer processes
 */

// Core entity types
export interface Animal {
  id: number;
  number: number;
  currentCage: number | null;
  currentWeight: number | null;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cage {
  id: number;
  number: number;
  groupName: string | null;
  capacity: number;
  createdAt: Date;
}

export interface Reading {
  id: number;
  animalId: number;
  weight: number;
  cageId: number;
  timestamp: Date;
  notes: string | null;
  sessionId: number;
}

// Session and context management
export interface Session {
  id: number;
  startTime: Date;
  endTime: Date | null;
  isActive: boolean;
}

export interface SessionContext {
  sessionId: number;
  lastRat: number | null;
  lastCage: number | null;
  lastWeight: number | null;
  updatedAt: Date;
}

// Command processing types
export interface Command {
  type: 'record' | 'update' | 'move' | 'query' | 'system';
  confidence: number;
  entities: {
    rat?: number;
    cage?: number;
    weight?: number;
    group?: string;
    action?: string;
  };
  needsConfirmation: boolean;
  contextUsed: boolean;
  rawText: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  needsConfirmation?: boolean;
  confirmationPrompt?: string;
}

// Audio processing types
export interface AudioChunk {
  buffer: Float32Array;
  timestamp: number;
  duration: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  processingTime: number;
}

// Application state types
export interface AppState {
  isListening: boolean;
  isProcessing: boolean;
  currentSession: Session | null;
  context: SessionContext | null;
  lastCommand: Command | null;
}

// IPC channel types for Electron communication
export interface IpcChannels {
  // Audio controls
  'audio:start-listening': () => void;
  'audio:stop-listening': () => void;
  'audio:status': (status: { isListening: boolean; level: number }) => void;

  // Speech processing
  'speech:transcription': (result: TranscriptionResult) => void;
  'speech:error': (error: string) => void;

  // Command execution
  'command:execute': (command: Command) => void;
  'command:result': (result: CommandResult) => void;
  'command:confirmation': (prompt: string) => void;

  // Database operations
  'db:query': (query: string, params?: any[]) => Promise<any>;
  'db:animals': () => Promise<Animal[]>;
  'db:readings': (animalId?: number) => Promise<Reading[]>;
}

// Error types
export class LabAssistError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LabAssistError';
  }
}

export type ErrorCodes = 
  | 'AUDIO_DEVICE_ERROR'
  | 'SPEECH_PROCESSING_ERROR'
  | 'DATABASE_ERROR'
  | 'COMMAND_PARSING_ERROR'
  | 'VALIDATION_ERROR';