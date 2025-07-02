"use strict";
/**
 * Electron main process entry point
 * Handles application lifecycle and creates the main window
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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const DatabaseManager_1 = require("./database/DatabaseManager");
const SpeechService_1 = require("./speech/SpeechService");
const CommandService_1 = require("./services/CommandService");
const IpcService_1 = require("./services/IpcService");
const app_config_1 = require("../shared/app-config");
class LabAssistApp {
    constructor() {
        this.mainWindow = null;
        this.databaseManager = new DatabaseManager_1.DatabaseManager();
        this.speechService = new SpeechService_1.SpeechService();
        this.commandService = new CommandService_1.CommandService(this.databaseManager);
    }
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Starting application initialization...');
            // Initialize database
            const config = (0, app_config_1.loadConfig)();
            if (config.database.enabled) {
                try {
                    await this.databaseManager.initialize();
                    console.log('Database initialized successfully');
                }
                catch (dbError) {
                    console.error('Database initialization failed:', dbError.message);
                    console.warn('Continuing without database functionality...');
                    console.warn('To fix: Run "npm run rebuild-native" to rebuild native modules for Electron');
                    // Don't throw - continue without database
                }
            }
            else {
                console.log('Database disabled in configuration - running without persistence');
            }
            // Initialize speech service with error handling
            try {
                await this.speechService.initialize();
                console.log('Speech service initialized successfully');
            }
            catch (speechError) {
                console.warn('Speech service initialization failed:', speechError.message);
                // Continue without speech service for now
            }
            // Setup IPC communication channels
            (0, IpcService_1.setupIpcHandlers)({
                speechService: this.speechService,
                commandService: this.commandService,
                databaseManager: this.databaseManager
            });
            console.log('Application initialization completed');
        }
        catch (error) {
            console.error('Fatal error during initialization:', error);
            process.exit(1);
        }
    }
    /**
     * Create the main application window
     */
    createMainWindow() {
        const config = (0, app_config_1.loadConfig)();
        this.mainWindow = new electron_1.BrowserWindow({
            width: config.ui.window.width,
            height: config.ui.window.height,
            minWidth: config.ui.window.minWidth,
            minHeight: config.ui.window.minHeight,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../preload/preload.js')
            },
            title: 'Lab Assist - Voice Lab Data Entry',
            icon: app_config_1.PATHS.ICON_PATH,
            show: false // Don't show until ready
        });
        // Load the renderer process
        this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        // Open dev tools in development
        if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }
        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
            this.mainWindow?.focus();
        });
        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }
    /**
     * Cleanup resources before app quit
     */
    async cleanup() {
        try {
            await this.speechService.cleanup();
            await this.databaseManager.close();
            console.log('Application cleanup completed');
        }
        catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}
// Application lifecycle management
const labAssist = new LabAssistApp();
electron_1.app.whenReady().then(async () => {
    await labAssist.initialize();
    labAssist.createMainWindow();
});
electron_1.app.on('window-all-closed', async () => {
    await labAssist.cleanup();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        labAssist.createMainWindow();
    }
});
electron_1.app.on('before-quit', async () => {
    await labAssist.cleanup();
});
// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await labAssist.cleanup();
    process.exit(1);
});
process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    await labAssist.cleanup();
    process.exit(1);
});
