"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcError = void 0;
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
class RpcError extends Error {
    constructor(code, message, data, origError) {
        super();
        this.code = code;
        this.message = message;
        this.data = data;
        this.origError = origError;
        Error.captureStackTrace(this, this.constructor);
        this.type = this.constructor.name;
        this.origErrorStack = this.origError?.stack;
    }
    toJSON() {
        return {
            type: this.type,
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }
    toString() {
        return `${this.type}: { ` +
            `type: "${this.type}", ` +
            `code: ${this.code}, ` +
            `message: "${this.message}", ` +
            `data: "${(0, fast_safe_stringify_1.default)(this.data)}" ` +
            `stack: "${this.stack}", ` +
            `origError: "${(0, fast_safe_stringify_1.default)(this.origError)}" ` +
            '}';
    }
}
exports.RpcError = RpcError;
