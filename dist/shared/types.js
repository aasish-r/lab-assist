"use strict";
/**
 * Shared type definitions for Lab Assist application
 * Used across main and renderer processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabAssistError = void 0;
// Error types
class LabAssistError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'LabAssistError';
    }
}
exports.LabAssistError = LabAssistError;
