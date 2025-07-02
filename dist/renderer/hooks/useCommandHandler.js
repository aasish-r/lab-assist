"use strict";
/**
 * Command Handler Hook
 * Manages command processing, message state, and event listeners
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCommandHandler = void 0;
const react_1 = require("react");
const useCommandHandler = () => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    // Add a new message to the chat
    const addMessage = (0, react_1.useCallback)((message) => {
        const newMessage = {
            ...message,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);
    // Clear all messages
    const clearMessages = (0, react_1.useCallback)(() => {
        setMessages([]);
    }, []);
    (0, react_1.useEffect)(() => {
        // Handle transcription results
        const handleTranscription = (result) => {
            addMessage({
                type: 'transcription',
                text: result.text,
                timestamp: new Date(),
                confidence: result.confidence
            });
        };
        // Handle command execution results
        const handleCommandResult = (result) => {
            addMessage({
                type: 'response',
                text: result.message,
                timestamp: new Date(),
                success: result.success
            });
        };
        // Handle confirmation prompts
        const handleConfirmation = (prompt) => {
            addMessage({
                type: 'response',
                text: prompt,
                timestamp: new Date(),
                success: undefined // Neutral state for confirmations
            });
        };
        // Handle speech errors
        const handleSpeechError = (error) => {
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
exports.useCommandHandler = useCommandHandler;
