/**
 * Command Handler Hook
 * Manages command processing, message state, and event listeners
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../components/ChatInterface';

export const useCommandHandler = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Add a new message to the chat
  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    // Handle transcription results
    const handleTranscription = (result: any) => {
      addMessage({
        type: 'transcription',
        text: result.text,
        timestamp: new Date(),
        confidence: result.confidence
      });
    };

    // Handle command execution results
    const handleCommandResult = (result: any) => {
      addMessage({
        type: 'response',
        text: result.message,
        timestamp: new Date(),
        success: result.success
      });
    };

    // Handle confirmation prompts
    const handleConfirmation = (prompt: string) => {
      addMessage({
        type: 'response',
        text: prompt,
        timestamp: new Date(),
        success: undefined // Neutral state for confirmations
      });
    };

    // Handle speech errors
    const handleSpeechError = (error: string) => {
      addMessage({
        type: 'error',
        text: `Speech recognition error: ${error}`,
        timestamp: new Date()
      });
    };

    // Register event listeners
    window.electronAPI.speech.onTranscription(handleTranscription);
    window.electronAPI.commands.onResult(handleCommandResult);
    window.electronAPI.commands.onConfirmation(handleConfirmation);
    window.electronAPI.speech.onError(handleSpeechError);

    // Cleanup listeners on unmount
    return () => {
      window.electronAPI.speech.removeTranscriptionListener();
      window.electronAPI.commands.removeResultListener();
      window.electronAPI.commands.removeConfirmationListener();
      window.electronAPI.speech.removeErrorListener();
    };
  }, [addMessage]);

  return {
    messages,
    addMessage,
    clearMessages
  };
};