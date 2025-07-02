"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInterface = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Chat Interface Component
 * Displays conversation between user and system, shows transcriptions and responses
 */
const react_1 = require("react");
const ChatInterface = ({ messages, onManualCommand }) => {
    const [inputValue, setInputValue] = (0, react_1.useState)('');
    const messagesEndRef = (0, react_1.useRef)(null);
    // Auto-scroll to bottom when new messages arrive
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onManualCommand(inputValue.trim());
            setInputValue('');
        }
    };
    const formatTimestamp = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    const getMessageClassName = (message) => {
        const baseClass = 'chat-message';
        const typeClass = `chat-message--${message.type}`;
        const successClass = message.success === false ? 'chat-message--error' : '';
        const confidenceClass = message.confidence && message.confidence < 0.7 ? 'chat-message--low-confidence' : '';
        return [baseClass, typeClass, successClass, confidenceClass].filter(Boolean).join(' ');
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "chat-interface", children: [(0, jsx_runtime_1.jsxs)("div", { className: "chat-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Lab Assistant Chat" }), (0, jsx_runtime_1.jsx)("div", { className: "chat-info", children: (0, jsx_runtime_1.jsxs)("span", { className: "message-count", children: [messages.length, " messages"] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "chat-messages", children: [messages.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "chat-empty", children: (0, jsx_runtime_1.jsxs)("div", { className: "empty-message", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Welcome to Lab Assist!" }), (0, jsx_runtime_1.jsx)("p", { children: "Start recording by clicking the microphone button or type a command below." }), (0, jsx_runtime_1.jsxs)("div", { className: "example-commands", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Example commands:" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "\"rat 5 cage 3 weight 280 grams\"" }), (0, jsx_runtime_1.jsx)("li", { children: "\"move rat 7 to cage 12\"" }), (0, jsx_runtime_1.jsx)("li", { children: "\"change weight to 300 grams\"" }), (0, jsx_runtime_1.jsx)("li", { children: "\"show rats around 250 grams\"" })] })] })] }) })) : (messages.map((message) => ((0, jsx_runtime_1.jsxs)("div", { className: getMessageClassName(message), children: [(0, jsx_runtime_1.jsxs)("div", { className: "message-header", children: [(0, jsx_runtime_1.jsxs)("span", { className: "message-type", children: [message.type === 'command' && '👤 You', message.type === 'response' && '🤖 Assistant', message.type === 'transcription' && '🎤 Heard', message.type === 'error' && '❌ Error'] }), (0, jsx_runtime_1.jsx)("span", { className: "message-time", children: formatTimestamp(message.timestamp) }), message.confidence && ((0, jsx_runtime_1.jsxs)("span", { className: `confidence-indicator confidence-indicator--${message.confidence >= 0.8 ? 'high' :
                                            message.confidence >= 0.6 ? 'medium' : 'low'}`, children: [Math.round(message.confidence * 100), "%"] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "message-content", children: message.text })] }, message.id)))), (0, jsx_runtime_1.jsx)("div", { ref: messagesEndRef })] }), (0, jsx_runtime_1.jsx)("div", { className: "chat-input-container", children: (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "chat-input-form", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), placeholder: "Type a command or use voice input...", className: "chat-input" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "chat-submit", disabled: !inputValue.trim(), children: "Send" })] }) })] }));
};
exports.ChatInterface = ChatInterface;
