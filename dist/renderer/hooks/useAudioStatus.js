"use strict";
/**
 * Audio Status Hook
 * Manages audio status state and event listeners
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAudioStatus = void 0;
const react_1 = require("react");
const useAudioStatus = () => {
    const [audioStatus, setAudioStatus] = (0, react_1.useState)({
        isListening: false,
        level: 0
    });
    (0, react_1.useEffect)(() => {
        // Setup audio status listener
        const handleStatusUpdate = (status) => {
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
exports.useAudioStatus = useAudioStatus;
