"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Main React App Component
 * Entry point for the renderer process UI
 */
const react_1 = require("react");
const ChatInterface_1 = require("./components/ChatInterface");
const ControlPanel_1 = require("./components/ControlPanel");
const StatusBar_1 = require("./components/StatusBar");
const DataView_1 = require("./components/DataView");
const useAudioStatus_1 = require("./hooks/useAudioStatus");
const useCommandHandler_1 = require("./hooks/useCommandHandler");
require("./styles/App.css");
const App = () => {
    const [appState, setAppState] = (0, react_1.useState)({
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
    const audioStatus = (0, useAudioStatus_1.useAudioStatus)();
    const commandHandler = (0, useCommandHandler_1.useCommandHandler)();
    // Update app state when audio status changes
    (0, react_1.useEffect)(() => {
        setAppState(prev => ({
            ...prev,
            isListening: audioStatus.isListening,
            audioLevel: audioStatus.level
        }));
    }, [audioStatus]);
    // Initialize system status on mount
    (0, react_1.useEffect)(() => {
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
            }
            catch (error) {
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
            }
            else {
                await window.electronAPI.audio.startListening();
            }
        }
        catch (error) {
            console.error('Failed to toggle listening:', error);
            // Could show error notification here
        }
    };
    // Handle view switching
    const handleViewChange = (view) => {
        setAppState(prev => ({ ...prev, currentView: view }));
    };
    // Handle manual command input
    const handleManualCommand = async (command) => {
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
        }
        catch (error) {
            console.error('Failed to execute manual command:', error);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app", children: [(0, jsx_runtime_1.jsxs)("header", { className: "app-header", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Lab Assist" }), (0, jsx_runtime_1.jsxs)("div", { className: "app-nav", children: [(0, jsx_runtime_1.jsx)("button", { className: `nav-button ${appState.currentView === 'chat' ? 'active' : ''}`, onClick: () => handleViewChange('chat'), children: "Chat" }), (0, jsx_runtime_1.jsx)("button", { className: `nav-button ${appState.currentView === 'data' ? 'active' : ''}`, onClick: () => handleViewChange('data'), children: "Data" })] })] }), (0, jsx_runtime_1.jsx)("main", { className: "app-main", children: appState.currentView === 'chat' ? ((0, jsx_runtime_1.jsxs)("div", { className: "chat-layout", children: [(0, jsx_runtime_1.jsx)("div", { className: "chat-container", children: (0, jsx_runtime_1.jsx)(ChatInterface_1.ChatInterface, { messages: commandHandler.messages, onManualCommand: handleManualCommand }) }), (0, jsx_runtime_1.jsx)("div", { className: "control-container", children: (0, jsx_runtime_1.jsx)(ControlPanel_1.ControlPanel, { isListening: appState.isListening, audioLevel: appState.audioLevel, onListeningToggle: handleListeningToggle, systemStatus: appState.systemStatus }) })] })) : ((0, jsx_runtime_1.jsx)(DataView_1.DataView, {})) }), (0, jsx_runtime_1.jsx)(StatusBar_1.StatusBar, { isListening: appState.isListening, audioLevel: appState.audioLevel, systemStatus: appState.systemStatus })] }));
};
exports.App = App;
exports.default = exports.App;
