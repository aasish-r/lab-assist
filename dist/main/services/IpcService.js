"use strict";
/**
 * IPC Service - Handles Inter-Process Communication between main and renderer
 * Sets up all IPC handlers for audio, speech, and database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
exports.setupIpcEventForwarding = setupIpcEventForwarding;
const electron_1 = require("electron");
/**
 * Setup all IPC communication handlers
 */
function setupIpcHandlers(services) {
    const { speechService, commandService, databaseManager } = services;
    // Audio control handlers (these will be handled in renderer process)
    // The renderer process will handle audio capture and send data via IPC
    electron_1.ipcMain.handle('audio:start-listening', async () => {
        return { success: true, message: 'Audio handling moved to renderer process' };
    });
    electron_1.ipcMain.handle('audio:stop-listening', async () => {
        return { success: true, message: 'Audio handling moved to renderer process' };
    });
    electron_1.ipcMain.handle('audio:get-devices', async () => {
        return { success: true, message: 'Audio handling moved to renderer process' };
    });
    electron_1.ipcMain.handle('audio:switch-device', async (event, deviceId) => {
        return { success: true, message: 'Audio handling moved to renderer process' };
    });
    electron_1.ipcMain.handle('audio:get-level', async () => {
        return { success: true, message: 'Audio handling moved to renderer process' };
    });
    // Handler for processing audio chunks from renderer
    electron_1.ipcMain.handle('speech:process-audio', async (event, audioChunk) => {
        try {
            const transcription = await speechService.transcribe(audioChunk);
            if (transcription.text.trim()) {
                // Process the transcribed command
                const result = await commandService.processCommand(transcription);
                return { success: true, transcription, result };
            }
            return { success: true, transcription, result: null };
        }
        catch (error) {
            console.error('Failed to process audio chunk:', error);
            return { success: false, error: error.message };
        }
    });
    // Speech service handlers
    electron_1.ipcMain.handle('speech:get-status', async () => {
        try {
            const status = speechService.getStatus();
            return { success: true, status };
        }
        catch (error) {
            console.error('Failed to get speech status:', error);
            return { success: false, error: error.message };
        }
    });
    // Command execution handlers
    electron_1.ipcMain.handle('command:execute', async (event, commandText) => {
        try {
            // Simulate transcription result for manual command input
            const transcription = {
                text: commandText,
                confidence: 1.0,
                processingTime: 0
            };
            const result = await commandService.processCommand(transcription);
            return { success: true, result };
        }
        catch (error) {
            console.error('Failed to execute command:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('command:confirm', async (event, confirmed) => {
        try {
            // Handle command confirmation
            // This would interact with a pending confirmation system
            return { success: true, confirmed };
        }
        catch (error) {
            console.error('Failed to handle confirmation:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('command:get-context', async () => {
        try {
            const context = commandService.getCurrentContext();
            return { success: true, context };
        }
        catch (error) {
            console.error('Failed to get command context:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('command:reset-context', async () => {
        try {
            await commandService.resetContext();
            return { success: true };
        }
        catch (error) {
            console.error('Failed to reset context:', error);
            return { success: false, error: error.message };
        }
    });
    // Database query handlers
    electron_1.ipcMain.handle('db:get-animals', async () => {
        try {
            // This would need to be implemented in DatabaseManager
            return { success: true, animals: [] };
        }
        catch (error) {
            console.error('Failed to get animals:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('db:get-readings', async (event, animalId) => {
        try {
            // This would need to be implemented in DatabaseManager
            return { success: true, readings: [] };
        }
        catch (error) {
            console.error('Failed to get readings:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('db:get-session-history', async (event, limit = 100) => {
        try {
            // This would need to be implemented in DatabaseManager
            return { success: true, history: [] };
        }
        catch (error) {
            console.error('Failed to get session history:', error);
            return { success: false, error: error.message };
        }
    });
    // System information handlers
    electron_1.ipcMain.handle('system:get-status', async () => {
        try {
            const status = {
                audio: {
                    initialized: true,
                    isListening: false // This would come from audioManager
                },
                speech: {
                    ready: speechService.isReady(),
                    status: speechService.getStatus()
                },
                database: {
                    connected: true // This would come from databaseManager
                },
                session: {
                    active: true,
                    context: commandService.getCurrentContext()
                }
            };
            return { success: true, status };
        }
        catch (error) {
            console.error('Failed to get system status:', error);
            return { success: false, error: error.message };
        }
    });
    // Application lifecycle handlers
    electron_1.ipcMain.handle('app:get-version', async () => {
        try {
            const { app } = require('electron');
            return { success: true, version: app.getVersion() };
        }
        catch (error) {
            console.error('Failed to get app version:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('app:show-save-dialog', async () => {
        try {
            const { dialog } = require('electron');
            const result = await dialog.showSaveDialog({
                title: 'Export Lab Data',
                defaultPath: 'lab-data.csv',
                filters: [
                    { name: 'CSV Files', extensions: ['csv'] },
                    { name: 'Excel Files', extensions: ['xlsx'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            return { success: true, result };
        }
        catch (error) {
            console.error('Failed to show save dialog:', error);
            return { success: false, error: error.message };
        }
    });
    console.log('IPC handlers setup completed');
}
/**
 * Setup IPC event forwarding from main to renderer
 * These are used to send updates from services to the UI
 */
function setupIpcEventForwarding() {
    // These would be called by the services to send updates to renderer
    // For example, audioManager.on('statusUpdate', (status) => {
    //   mainWindow.webContents.send('audio:status-update', status);
    // });
    console.log('IPC event forwarding setup completed');
}
