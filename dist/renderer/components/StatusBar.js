"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const StatusBar = ({ isListening, audioLevel, systemStatus }) => {
    const getSystemHealth = () => {
        const healthy = Object.values(systemStatus).every(status => status);
        return healthy ? 'healthy' : 'warning';
    };
    const formatAudioLevel = () => {
        return Math.round(audioLevel * 100);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "status-bar", children: [(0, jsx_runtime_1.jsx)("div", { className: "status-section", children: (0, jsx_runtime_1.jsxs)("div", { className: `status-indicator status-indicator--${isListening ? 'active' : 'inactive'}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "status-icon", children: isListening ? '🎤' : '⏸️' }), (0, jsx_runtime_1.jsx)("span", { className: "status-text", children: isListening ? `Listening (${formatAudioLevel()}%)` : 'Not Listening' })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "status-section", children: (0, jsx_runtime_1.jsxs)("div", { className: `system-health system-health--${getSystemHealth()}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "health-icon", children: getSystemHealth() === 'healthy' ? '💚' : '⚠️' }), (0, jsx_runtime_1.jsxs)("span", { className: "health-text", children: ["System ", getSystemHealth() === 'healthy' ? 'Ready' : 'Issues'] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "status-section", children: (0, jsx_runtime_1.jsxs)("div", { className: "status-details", children: [(0, jsx_runtime_1.jsxs)("span", { className: "detail-item", children: ["Audio: ", systemStatus.audio ? '✓' : '✗'] }), (0, jsx_runtime_1.jsxs)("span", { className: "detail-item", children: ["Speech: ", systemStatus.speech ? '✓' : '✗'] }), (0, jsx_runtime_1.jsxs)("span", { className: "detail-item", children: ["DB: ", systemStatus.database ? '✓' : '✗'] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "status-section", children: (0, jsx_runtime_1.jsx)("div", { className: "app-info", children: (0, jsx_runtime_1.jsx)("span", { className: "app-name", children: "Lab Assist v1.0.0" }) }) })] }));
};
exports.StatusBar = StatusBar;
