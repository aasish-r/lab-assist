/**
 * Preload Script - Exposes safe APIs to the renderer process
 * Provides secure communication bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/types';

// Define the API that will be exposed to the renderer
const electronAPI = {
  // Audio controls
  audio: {
    startListening: () => ipcRenderer.invoke('audio:start-listening'),
    stopListening: () => ipcRenderer.invoke('audio:stop-listening'),
    getDevices: () => ipcRenderer.invoke('audio:get-devices'),
    switchDevice: (deviceId: string) => ipcRenderer.invoke('audio:switch-device', deviceId),
    getLevel: () => ipcRenderer.invoke('audio:get-level'),
    
    // Audio event listeners
    onStatusUpdate: (callback: (status: { isListening: boolean; level: number }) => void) => {
      ipcRenderer.on('audio:status', (event, status) => callback(status));
    },
    removeStatusListener: () => {
      ipcRenderer.removeAllListeners('audio:status');
    }
  },

  // Speech recognition
  speech: {
    getStatus: () => ipcRenderer.invoke('speech:get-status'),
    
    // Speech event listeners
    onTranscription: (callback: (result: any) => void) => {
      ipcRenderer.on('speech:transcription', (event, result) => callback(result));
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('speech:error', (event, error) => callback(error));
    },
    removeTranscriptionListener: () => {
      ipcRenderer.removeAllListeners('speech:transcription');
    },
    removeErrorListener: () => {
      ipcRenderer.removeAllListeners('speech:error');
    }
  },

  // Command execution
  commands: {
    execute: (commandText: string) => ipcRenderer.invoke('command:execute', commandText),
    confirm: (confirmed: boolean) => ipcRenderer.invoke('command:confirm', confirmed),
    getContext: () => ipcRenderer.invoke('command:get-context'),
    resetContext: () => ipcRenderer.invoke('command:reset-context'),
    
    // Command event listeners
    onResult: (callback: (result: any) => void) => {
      ipcRenderer.on('command:result', (event, result) => callback(result));
    },
    onConfirmation: (callback: (prompt: string) => void) => {
      ipcRenderer.on('command:confirmation', (event, prompt) => callback(prompt));
    },
    removeResultListener: () => {
      ipcRenderer.removeAllListeners('command:result');
    },
    removeConfirmationListener: () => {
      ipcRenderer.removeAllListeners('command:confirmation');
    }
  },

  // Database queries
  database: {
    getAnimals: () => ipcRenderer.invoke('db:get-animals'),
    getReadings: (animalId?: number) => ipcRenderer.invoke('db:get-readings', animalId),
    getSessionHistory: (limit?: number) => ipcRenderer.invoke('db:get-session-history', limit)
  },

  // System information
  system: {
    getStatus: () => ipcRenderer.invoke('system:get-status'),
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    showSaveDialog: () => ipcRenderer.invoke('app:show-save-dialog')
  },

  // Utility functions
  utils: {
    // Remove all event listeners (cleanup)
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('audio:status');
      ipcRenderer.removeAllListeners('speech:transcription');
      ipcRenderer.removeAllListeners('speech:error');
      ipcRenderer.removeAllListeners('command:result');
      ipcRenderer.removeAllListeners('command:confirmation');
    }
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for the exposed API
export type ElectronAPI = typeof electronAPI;

// Also expose types for TypeScript support in renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}