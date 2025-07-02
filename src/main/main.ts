/**
 * Electron main process entry point
 * Handles application lifecycle and creates the main window
 */

import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import { DatabaseManager } from './database/DatabaseManager';
import { SpeechService } from './speech/SpeechService';
import { CommandService } from './services/CommandService';
import { setupIpcHandlers } from './services/IpcService';
import { loadConfig, PATHS } from '../shared/app-config';

class LabAssistApp {
  private mainWindow: BrowserWindow | null = null;
  private databaseManager: DatabaseManager;
  private speechService: SpeechService;
  private commandService: CommandService;

  constructor() {
    this.databaseManager = new DatabaseManager();
    this.speechService = new SpeechService();
    this.commandService = new CommandService(this.databaseManager);
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      console.log('Starting application initialization...');

      // Initialize database
      const config = loadConfig();
      if (config.database.enabled) {
        try {
          await this.databaseManager.initialize();
          console.log('Database initialized successfully');
        } catch (dbError) {
          console.error('Database initialization failed:', dbError.message);
          console.warn('Continuing without database functionality...');
          console.warn('To fix: Run "npm run rebuild-native" to rebuild native modules for Electron');
          // Don't throw - continue without database
        }
      } else {
        console.log('Database disabled in configuration - running without persistence');
      }
      
      // Initialize speech service with error handling
      try {
        await this.speechService.initialize();
        console.log('Speech service initialized successfully');
      } catch (speechError) {
        console.warn('Speech service initialization failed:', speechError.message);
        // Continue without speech service for now
      }

      // Setup IPC communication channels
      setupIpcHandlers({
        speechService: this.speechService,
        commandService: this.commandService,
        databaseManager: this.databaseManager
      });

      console.log('Application initialization completed');

    } catch (error) {
      console.error('Fatal error during initialization:', error);
      process.exit(1);
    }
  }

  /**
   * Create the main application window
   */
  createMainWindow(): void {
    const config = loadConfig();
    
    this.mainWindow = new BrowserWindow({
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
      icon: PATHS.ICON_PATH,
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
  async cleanup(): Promise<void> {
    try {
      await this.speechService.cleanup();
      await this.databaseManager.close();
      console.log('Application cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Application lifecycle management
const labAssist = new LabAssistApp();

app.whenReady().then(async () => {
  await labAssist.initialize();
  labAssist.createMainWindow();
});

app.on('window-all-closed', async () => {
  await labAssist.cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    labAssist.createMainWindow();
  }
});

app.on('before-quit', async () => {
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