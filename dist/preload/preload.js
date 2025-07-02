"use strict";
/**
 * Preload Script - Exposes safe APIs to the renderer process
 * Provides secure communication bridge between main and renderer processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Define the API that will be exposed to the renderer
const electronAPI = {
    // Audio controls
    audio: {
        startListening: () => electron_1.ipcRenderer.invoke('audio:start-listening'),
        stopListening: () => electron_1.ipcRenderer.invoke('audio:stop-listening'),
        getDevices: () => electron_1.ipcRenderer.invoke('audio:get-devices'),
        switchDevice: (deviceId) => electron_1.ipcRenderer.invoke('audio:switch-device', deviceId),
        getLevel: () => electron_1.ipcRenderer.invoke('audio:get-level'),
        // Audio event listeners
        onStatusUpdate: (callback) => {
            electron_1.ipcRenderer.on('audio:status', (event, status) => callback(status));
        },
        removeStatusListener: () => {
            electron_1.ipcRenderer.removeAllListeners('audio:status');
        }
    },
    // Speech recognition
    speech: {
        getStatus: () => electron_1.ipcRenderer.invoke('speech:get-status'),
        // Speech event listeners
        onTranscription: (callback) => {
            electron_1.ipcRenderer.on('speech:transcription', (event, result) => callback(result));
        },
        onError: (callback) => {
            electron_1.ipcRenderer.on('speech:error', (event, error) => callback(error));
        },
        removeTranscriptionListener: () => {
            electron_1.ipcRenderer.removeAllListeners('speech:transcription');
        },
        removeErrorListener: () => {
            electron_1.ipcRenderer.removeAllListeners('speech:error');
        }
    },
    // Command execution
    commands: {
        execute: (commandText) => electron_1.ipcRenderer.invoke('command:execute', commandText),
        confirm: (confirmed) => electron_1.ipcRenderer.invoke('command:confirm', confirmed),
        getContext: () => electron_1.ipcRenderer.invoke('command:get-context'),
        resetContext: () => electron_1.ipcRenderer.invoke('command:reset-context'),
        // Command event listeners
        onResult: (callback) => {
            electron_1.ipcRenderer.on('command:result', (event, result) => callback(result));
        },
        onConfirmation: (callback) => {
            electron_1.ipcRenderer.on('command:confirmation', (event, prompt) => callback(prompt));
        },
        removeResultListener: () => {
            electron_1.ipcRenderer.removeAllListeners('command:result');
        },
        removeConfirmationListener: () => {
            electron_1.ipcRenderer.removeAllListeners('command:confirmation');
        }
    },
    // Database queries
    database: {
        getAnimals: () => electron_1.ipcRenderer.invoke('db:get-animals'),
        getReadings: (animalId) => electron_1.ipcRenderer.invoke('db:get-readings', animalId),
        getSessionHistory: (limit) => electron_1.ipcRenderer.invoke('db:get-session-history', limit)
    },
    // System information
    system: {
        getStatus: () => electron_1.ipcRenderer.invoke('system:get-status'),
        getVersion: () => electron_1.ipcRenderer.invoke('app:get-version'),
        showSaveDialog: () => electron_1.ipcRenderer.invoke('app:show-save-dialog')
    },
    // Utility functions
    utils: {
        // Remove all event listeners (cleanup)
        removeAllListeners: () => {
            electron_1.ipcRenderer.removeAllListeners('audio:status');
            electron_1.ipcRenderer.removeAllListeners('speech:transcription');
            electron_1.ipcRenderer.removeAllListeners('speech:error');
            electron_1.ipcRenderer.removeAllListeners('command:result');
            electron_1.ipcRenderer.removeAllListeners('command:confirmation');
        }
    }
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
