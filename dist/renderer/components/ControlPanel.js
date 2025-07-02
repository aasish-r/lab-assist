"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlPanel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Control Panel Component
 * Provides audio controls, system status, and recording settings
 */
const react_1 = require("react");
const ControlPanel = ({ isListening, audioLevel, onListeningToggle, systemStatus }) => {
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const getStatusIcon = (status) => {
        return status ? '✅' : '❌';
    };
    const getAudioLevelWidth = () => {
        return `${Math.min(audioLevel * 100, 100)}%`;
    };
    const getAudioLevelClass = () => {
        if (audioLevel > 0.8)
            return 'audio-level--high';
        if (audioLevel > 0.3)
            return 'audio-level--medium';
        return 'audio-level--low';
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "control-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "control-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Recording Control" }), (0, jsx_runtime_1.jsx)("div", { className: "recording-controls", children: (0, jsx_runtime_1.jsxs)("button", { className: `record-button ${isListening ? 'record-button--active' : ''}`, onClick: onListeningToggle, children: [(0, jsx_runtime_1.jsx)("div", { className: "record-icon", children: isListening ? '⏹️' : '🎤' }), (0, jsx_runtime_1.jsx)("span", { className: "record-text", children: isListening ? 'Stop Listening' : 'Start Listening' })] }) }), isListening && ((0, jsx_runtime_1.jsxs)("div", { className: "audio-level-container", children: [(0, jsx_runtime_1.jsx)("label", { className: "audio-level-label", children: "Audio Level:" }), (0, jsx_runtime_1.jsx)("div", { className: "audio-level-bar", children: (0, jsx_runtime_1.jsx)("div", { className: `audio-level-fill ${getAudioLevelClass()}`, style: { width: getAudioLevelWidth() } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "audio-level-value", children: [Math.round(audioLevel * 100), "%"] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "control-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "System Status" }), (0, jsx_runtime_1.jsxs)("div", { className: "status-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "status-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-icon", children: getStatusIcon(systemStatus.audio) }), (0, jsx_runtime_1.jsx)("span", { className: "status-label", children: "Audio System" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "status-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-icon", children: getStatusIcon(systemStatus.speech) }), (0, jsx_runtime_1.jsx)("span", { className: "status-label", children: "Speech Recognition" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "status-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-icon", children: getStatusIcon(systemStatus.database) }), (0, jsx_runtime_1.jsx)("span", { className: "status-label", children: "Database" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "control-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "section-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Settings" }), (0, jsx_runtime_1.jsx)("button", { className: "toggle-button", onClick: () => setShowSettings(!showSettings), children: showSettings ? '▼' : '▶' })] }), showSettings && ((0, jsx_runtime_1.jsx)("div", { className: "settings-content", children: (0, jsx_runtime_1.jsxs)("div", { className: "setting-item", children: [(0, jsx_runtime_1.jsx)("label", { className: "setting-label", children: "Audio Input Device:" }), (0, jsx_runtime_1.jsx)("select", { className: "setting-select", children: (0, jsx_runtime_1.jsx)("option", { children: "Default Microphone" }) })] }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "control-section control-section--help", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Voice Commands" }), (0, jsx_runtime_1.jsxs)("div", { className: "help-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "command-example", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Record:" }), " \"rat 5 cage 3 weight 280 grams\""] }), (0, jsx_runtime_1.jsxs)("div", { className: "command-example", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Update:" }), " \"change weight to 300 grams\""] }), (0, jsx_runtime_1.jsxs)("div", { className: "command-example", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Move:" }), " \"move rat 7 to cage 12\""] }), (0, jsx_runtime_1.jsxs)("div", { className: "command-example", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Query:" }), " \"show rats around 250 grams\""] }), (0, jsx_runtime_1.jsxs)("div", { className: "command-example", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Stop:" }), " \"stop listening\""] })] })] })] }));
};
exports.ControlPanel = ControlPanel;
