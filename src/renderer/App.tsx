/**
 * Main React App Component
 * Entry point for the renderer process UI
 */

import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { ControlPanel } from './components/ControlPanel';
import { StatusBar } from './components/StatusBar';
import { DataView } from './components/DataView';
import { useAudioStatus } from './hooks/useAudioStatus';
import { useCommandHandler } from './hooks/useCommandHandler';
import './styles/App.css';

interface AppState {
  isListening: boolean;
  audioLevel: number;
  currentView: 'chat' | 'data';
  systemStatus: {
    audio: boolean;
    speech: boolean;
    database: boolean;
  };
}

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isListening: false,
    audioLevel: 0,
    currentView: 'chat',
    systemStatus: {
      audio: false,
      speech: false,
      database: false
    }
  });

  // Custom hooks for audio and command handling
  const audioStatus = useAudioStatus();
  const commandHandler = useCommandHandler();

  // Update app state when audio status changes
  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      isListening: audioStatus.isListening,
      audioLevel: audioStatus.level
    }));
  }, [audioStatus]);

  // Initialize system status on mount
  useEffect(() => {
    const initializeStatus = async () => {
      try {
        const status = await window.electronAPI.system.getStatus();
        if (status.success) {
          setAppState(prev => ({
            ...prev,
            systemStatus: {
              audio: status.status.audio.initialized,
              speech: status.status.speech.ready,
              database: status.status.database.connected
            }
          }));
        }
      } catch (error) {
        console.error('Failed to get system status:', error);
      }
    };

    initializeStatus();
  }, []);

  // Handle listening toggle
  const handleListeningToggle = async () => {
    try {
      if (appState.isListening) {
        await window.electronAPI.audio.stopListening();
      } else {
        await window.electronAPI.audio.startListening();
      }
    } catch (error) {
      console.error('Failed to toggle listening:', error);
      // Could show error notification here
    }
  };

  // Handle view switching
  const handleViewChange = (view: 'chat' | 'data') => {
    setAppState(prev => ({ ...prev, currentView: view }));
  };

  // Handle manual command input
  const handleManualCommand = async (command: string) => {
    try {
      const result = await window.electronAPI.commands.execute(command);
      if (result.success) {
        commandHandler.addMessage({
          type: 'command',
          text: command,
          timestamp: new Date(),
          confidence: 1.0
        });
        
        commandHandler.addMessage({
          type: 'response',
          text: result.result.message,
          timestamp: new Date(),
          success: result.result.success
        });
      }
    } catch (error) {
      console.error('Failed to execute manual command:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lab Assist</h1>
        <div className="app-nav">
          <button 
            className={`nav-button ${appState.currentView === 'chat' ? 'active' : ''}`}
            onClick={() => handleViewChange('chat')}
          >
            Chat
          </button>
          <button 
            className={`nav-button ${appState.currentView === 'data' ? 'active' : ''}`}
            onClick={() => handleViewChange('data')}
          >
            Data
          </button>
        </div>
      </header>

      <main className="app-main">
        {appState.currentView === 'chat' ? (
          <div className="chat-layout">
            <div className="chat-container">
              <ChatInterface 
                messages={commandHandler.messages}
                onManualCommand={handleManualCommand}
              />
            </div>
            <div className="control-container">
              <ControlPanel 
                isListening={appState.isListening}
                audioLevel={appState.audioLevel}
                onListeningToggle={handleListeningToggle}
                systemStatus={appState.systemStatus}
              />
            </div>
          </div>
        ) : (
          <DataView />
        )}
      </main>

      <StatusBar 
        isListening={appState.isListening}
        audioLevel={appState.audioLevel}
        systemStatus={appState.systemStatus}
      />
    </div>
  );
};

export default App;