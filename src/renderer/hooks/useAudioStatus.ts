/**
 * Audio Status Hook
 * Manages audio status state and event listeners
 */

import { useState, useEffect } from 'react';

interface AudioStatus {
  isListening: boolean;
  level: number;
}

export const useAudioStatus = () => {
  const [audioStatus, setAudioStatus] = useState<AudioStatus>({
    isListening: false,
    level: 0
  });

  useEffect(() => {
    // Setup audio status listener
    const handleStatusUpdate = (status: { isListening: boolean; level: number }) => {
      setAudioStatus(status);
    };

    // Register listener
    window.electronAPI.audio.onStatusUpdate(handleStatusUpdate);

    // Cleanup listener on unmount
    return () => {
      window.electronAPI.audio.removeStatusListener();
    };
  }, []);

  return audioStatus;
};