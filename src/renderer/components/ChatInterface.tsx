/**
 * Chat Interface Component
 * Displays conversation between user and system, shows transcriptions and responses
 */

import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaRobot, FaMicrophone, FaTimes } from 'react-icons/fa';

export interface ChatMessage {
  id: string;
  type: 'command' | 'response' | 'transcription' | 'error';
  text: string;
  timestamp: Date;
  confidence?: number;
  success?: boolean;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onManualCommand: (command: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onManualCommand 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onManualCommand(inputValue.trim());
      setInputValue('');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getMessageClassName = (message: ChatMessage) => {
    const baseClass = 'chat-message';
    const typeClass = `chat-message--${message.type}`;
    const successClass = message.success === false ? 'chat-message--error' : '';
    const confidenceClass = message.confidence && message.confidence < 0.7 ? 'chat-message--low-confidence' : '';
    
    return [baseClass, typeClass, successClass, confidenceClass].filter(Boolean).join(' ');
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Lab Assistant Chat</h2>
        <div className="chat-info">
          <span className="message-count">{messages.length} messages</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-message">
              <h3>Welcome to Lab Assist!</h3>
              <p>Start recording by clicking the microphone button or type a command below.</p>
              <div className="example-commands">
                <h4>Example commands:</h4>
                <ul>
                  <li>"rat 5 cage 3 weight 280 grams"</li>
                  <li>"move rat 7 to cage 12"</li>
                  <li>"change weight to 300 grams"</li>
                  <li>"show rats around 250 grams"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={getMessageClassName(message)}>
              <div className="message-header">
                <span className="message-type">
                  {message.type === 'command' && <><FaUser /> You</>}
                  {message.type === 'response' && <><FaRobot /> Assistant</>}
                  {message.type === 'transcription' && <><FaMicrophone /> Heard</>}
                  {message.type === 'error' && <><FaTimes /> Error</>}
                </span>
                <span className="message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.confidence && (
                  <span className={`confidence-indicator confidence-indicator--${
                    message.confidence >= 0.8 ? 'high' : 
                    message.confidence >= 0.6 ? 'medium' : 'low'
                  }`}>
                    {Math.round(message.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a command or use voice input..."
            className="chat-input"
          />
          <button 
            type="submit" 
            className="chat-submit"
            disabled={!inputValue.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};