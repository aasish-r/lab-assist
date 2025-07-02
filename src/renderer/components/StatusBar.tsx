/**
 * Status Bar Component
 * Shows system status and current activity at the bottom of the app
 */

import React from 'react';
import { FaMicrophone, FaPause, FaHeart, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

interface SystemStatus {
  audio: boolean;
  speech: boolean;
  database: boolean;
}

interface StatusBarProps {
  isListening: boolean;
  audioLevel: number;
  systemStatus: SystemStatus;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isListening,
  audioLevel,
  systemStatus
}) => {
  const getSystemHealth = () => {
    const healthy = Object.values(systemStatus).every(status => status);
    return healthy ? 'healthy' : 'warning';
  };

  const formatAudioLevel = () => {
    return Math.round(audioLevel * 100);
  };

  return (
    <div className="status-bar">
      <div className="status-section">
        <div className={`status-indicator status-indicator--${isListening ? 'active' : 'inactive'}`}>
          <span className="status-icon">
  {isListening ? <FaMicrophone /> : <FaPause />}
          </span>
          <span className="status-text">
            {isListening ? `Listening (${formatAudioLevel()}%)` : 'Not Listening'}
          </span>
        </div>
      </div>

      <div className="status-section">
        <div className={`system-health system-health--${getSystemHealth()}`}>
          <span className="health-icon">
  {getSystemHealth() === 'healthy' ? <FaHeart className="text-green-500" /> : <FaExclamationTriangle className="text-yellow-500" />}
          </span>
          <span className="health-text">
            System {getSystemHealth() === 'healthy' ? 'Ready' : 'Issues'}
          </span>
        </div>
      </div>

      <div className="status-section">
        <div className="status-details">
          <span className="detail-item">
            Audio: {systemStatus.audio ? <FaCheck /> : <FaTimes />}
          </span>
          <span className="detail-item">
            Speech: {systemStatus.speech ? <FaCheck /> : <FaTimes />}
          </span>
          <span className="detail-item">
            DB: {systemStatus.database ? <FaCheck /> : <FaTimes />}
          </span>
        </div>
      </div>

      <div className="status-section">
        <div className="app-info">
          <span className="app-name">Lab Assist v1.0.0</span>
        </div>
      </div>
    </div>
  );
};