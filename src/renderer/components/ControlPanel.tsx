/**
 * Control Panel Component
 * Provides audio controls, system status, and recording settings
 */

import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaChevronDown, FaChevronRight, FaCheck, FaTimes } from 'react-icons/fa';

interface SystemStatus {
  audio: boolean;
  speech: boolean;
  database: boolean;
}

interface ControlPanelProps {
  isListening: boolean;
  audioLevel: number;
  onListeningToggle: () => void;
  systemStatus: SystemStatus;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isListening,
  audioLevel,
  onListeningToggle,
  systemStatus
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const getStatusIcon = (status: boolean) => {
    return status ? <FaCheck className="status-icon status-icon--active" /> : <FaTimes className="status-icon status-icon--inactive" />;
  };

  const getAudioLevelWidth = () => {
    return `${Math.min(audioLevel * 100, 100)}%`;
  };

  const getAudioLevelClass = () => {
    if (audioLevel > 0.8) return 'audio-level--high';
    if (audioLevel > 0.3) return 'audio-level--medium';
    return 'audio-level--low';
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3>Recording Control</h3>
        
        <div className="recording-controls">
          <button
            className={`record-button ${isListening ? 'record-button--active' : ''}`}
            onClick={onListeningToggle}
          >
            <div className="record-icon">
              {isListening ? <FaStop /> : <FaMicrophone />}
            </div>
            <span className="record-text">
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </span>
          </button>
        </div>

        {isListening && (
          <div className="audio-level-container">
            <label className="audio-level-label">Audio Level:</label>
            <div className="audio-level-bar">
              <div 
                className={`audio-level-fill ${getAudioLevelClass()}`}
                style={{ width: getAudioLevelWidth() }}
              />
            </div>
            <span className="audio-level-value">
              {Math.round(audioLevel * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="control-section">
        <h3>System Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-icon">{getStatusIcon(systemStatus.audio)}</span>
            <span className="status-label">Audio System</span>
          </div>
          <div className="status-item">
            <span className="status-icon">{getStatusIcon(systemStatus.speech)}</span>
            <span className="status-label">Speech Recognition</span>
          </div>
          <div className="status-item">
            <span className="status-icon">{getStatusIcon(systemStatus.database)}</span>
            <span className="status-label">Database</span>
          </div>
        </div>
      </div>

      <div className="control-section">
        <div className="section-header">
          <h3>Settings</h3>
          <button 
            className="toggle-button"
            onClick={() => setShowSettings(!showSettings)}
          >
{showSettings ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        </div>
        
        {showSettings && (
          <div className="settings-content">
            <div className="setting-item">
              <label className="setting-label">Audio Input Device:</label>
              <select className="setting-select">
                <option>Default Microphone</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="control-section control-section--help">
        <h3>Voice Commands</h3>
        <div className="help-content">
          <div className="command-example">
            <strong>Record:</strong> "rat 5 cage 3 weight 280 grams"
          </div>
          <div className="command-example">
            <strong>Update:</strong> "change weight to 300 grams"
          </div>
          <div className="command-example">
            <strong>Move:</strong> "move rat 7 to cage 12"
          </div>
          <div className="command-example">
            <strong>Query:</strong> "show rats around 250 grams"
          </div>
          <div className="command-example">
            <strong>Stop:</strong> "stop listening"
          </div>
        </div>
      </div>
    </div>
  );
};