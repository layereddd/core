"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const lodash_1 = __importDefault(require("lodash"));
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
class AppError extends Error {
    constructor(code, message, details, origError) {
        super();
        this.code = code;
        this.message = message;
        this.details = details;
        this.origError = origError;
        Error.captureStackTrace(this, this.constructor);
        this.details = this.details ? JSON.parse((0, fast_safe_stringify_1.default)(details)) : undefined;
        this.type = this.constructor.name;
        this.code = this.code.toUpperCase();
        this.origErrorStack = this.origError?.stack;
    }
    static from(err) {
        if (err instanceof AppError) {
            return err;
        }
        else if (err && err.type === 'AppError') {
            return new AppError(String(err.code || 'UNKNOWN APP ERROR'), String(err.message || 'Unknown error'), err.details, err);
        }
        else if (err instanceof Error) {
            const generalErr = err;
            if (generalErr.isJoi) {
                const inKey = lodash_1.default.get(generalErr, 'inKey', '_');
                const errDetails = lodash_1.default.get(generalErr, 'details');
                const errList = (Array.isArray(errDetails) ? errDetails : [])
                    .filter(Boolean)
                    .map((it) => {
                    return {
                        message: it.message,
                        key: (it.context || {}).key,
                        value: (it.context || {}).value,
                    };
                });
                return new AppError('VALIDATION ERROR', `Validation failed for ${inKey}`, { in: inKey, errors: errList }, generalErr);
            }
            else {
                return new AppError('INTERNAL ERROR', 'Internal error', undefined, err);
            }
        }
        else {
            return new AppError('UNKNOWN ERROR', 'Unknown error', undefined, err);
        }
    }
    toJSON() {
        return {
            type: this.type,
            code: this.code,
            message: this.message,
            details: this.details,
            origError: this.origError,
        };
    }
    toString() {
        return `${this.type}: { ` +
            `type: "${this.type}", ` +
            `code: "${this.code}", ` +
            `message: "${this.message}", ` +
            `details: "${(0, fast_safe_stringify_1.default)(this.details)}", ` +
            `stack: "${this.stack}", ` +
            `origError: "${(0, fast_safe_stringify_1.default)(this.origError)}" ` +
            '}';
    }
}
exports.AppError = AppError;
