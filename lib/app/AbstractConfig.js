"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractConfig = void 0;
const fs_1 = __importDefault(require("fs"));
class AbstractConfig {
    getNumber(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain valid number. Got undefined`);
            }
        }
        if (value === '') {
            throw new TypeError(`Config key "${key}" MUST contain valid number. Got ""`);
        }
        const num = Number(value);
        if (Number.isFinite(num)) {
            return num;
        }
        else {
            throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value}"`);
        }
    }
    getString(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain string. Got undefined`);
            }
        }
        return value;
    }
    getBoolean(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain valid boolean (true, false). Got undefined`);
            }
        }
        if (value === 'true') {
            return true;
        }
        else if (value === 'false') {
            return false;
        }
        else {
            throw new TypeError(`Config key "${key}" MUST contain valid boolean (true, false). Got "${value}"`);
        }
    }
    getFile(key) {
        const value = process.env[key];
        if (value === undefined) {
            throw new TypeError(`Config key "${key}" MUST contain path to file. Got undefined`);
        }
        if (value === '') {
            throw new TypeError(`Config key "${key}" MUST contain path to file. Got ""`);
        }
        try {
            return fs_1.default.readFileSync(value, { encoding: 'utf8' });
        }
        catch (err) {
            throw new TypeError(`File reading of config key "${key}" with value ${value} fails with error: ${err.message}`);
        }
    }
    getArrayString(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain string. Got undefined`);
            }
        }
        return value.split(',');
    }
    getArrayNumber(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain valid number. Got undefined`);
            }
        }
        if (value === '') {
            throw new TypeError(`Config key "${key}" MUST contain valid number. Got ""`);
        }
        return value.split(',').map((item) => {
            const num = Number(item);
            if (Number.isFinite(num)) {
                return num;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value}"`);
            }
        });
    }
    getJSON(key, defaultValue) {
        const value = process.env[key];
        let parsed;
        if (value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            else {
                throw new TypeError(`Config key "${key}" MUST contain valid json string. Got undefined`);
            }
        }
        try {
            parsed = JSON.parse(value);
        }
        catch (err) {
            throw new TypeError(`Config key "${key}" MUST contain valid json string. Got "${value}"`);
        }
        return parsed;
    }
}
exports.AbstractConfig = AbstractConfig;
