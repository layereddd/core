"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebError = void 0;
const http_1 = require("http");
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
const lodash_1 = __importDefault(require("lodash"));
const AppError_1 = require("../../app/AppError");
class WebError extends Error {
    constructor(statusCode, error, message, details, origError) {
        super();
        Error.captureStackTrace(this, this.constructor);
        this.statusCode = Number(statusCode) || 500;
        this.error = (error || http_1.STATUS_CODES[this.statusCode] || 'UNKNOWN_WEB_ERROR').toUpperCase();
        this.details = details ? JSON.parse((0, fast_safe_stringify_1.default)(details)) : undefined;
        this.origError = origError;
        this.type = this.constructor.name;
        if (message) {
            this.message = message;
        }
        else {
            this.message = http_1.STATUS_CODES[this.statusCode] || 'UNKNOWN_WEB_ERROR';
        }
    }
    static from(err) {
        if (err.type === 'RpcError') {
            if (err.code === 400) {
                const code = lodash_1.default.get(err.data, 'appError.code', 'BAD DATA');
                const message = lodash_1.default.get(err.data, 'appError.message', err.message);
                const details = lodash_1.default.get(err.data, 'appError.details');
                return new WebError(400, code, message, details, err);
            }
            else {
                return new WebError(500, 'INTERNAL ERROR', err.message, undefined, err);
            }
        }
        else if (err instanceof AppError_1.AppError && err.code === 'ACCESS DENIED') {
            const errData = err.toJSON();
            return new WebError(400, errData.code, errData.message, errData.details, err);
        }
        else if (err instanceof AppError_1.AppError) {
            const errData = err.toJSON();
            return new WebError(500, errData.code, errData.message, errData.details, err);
        }
        else if (err instanceof WebError) {
            return err;
        }
        else {
            return new WebError(500, 'INTERNAL ERROR', 'Internal error', undefined, err);
        }
    }
    toJSON() {
        return {
            type: this.type,
            error: this.error,
            statusCode: this.statusCode,
            message: this.message,
            details: this.details,
        };
    }
    toString() {
        return `${this.type}: {` +
            `statusCode: ${this.statusCode}, ` +
            `error: ${this.error} ` +
            `message: ${this.message}, ` +
            `details: ${(0, fast_safe_stringify_1.default)(this.details)}, ` +
            `origError: ${(0, fast_safe_stringify_1.default)(this.origError)}` +
            '}';
    }
}
exports.WebError = WebError;
