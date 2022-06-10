"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
const AppError_1 = require("../../app/AppError");
class Redis {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
        if (!this.config.infra.redis) {
            throw new AppError_1.AppError('INVALID CONFIG', 'Missing config for Redis');
        }
        this.cfg = this.config.infra.redis;
        this.client = new ioredis_1.default({
            host: this.cfg.host,
            port: this.cfg.port,
            db: this.cfg.db,
            password: this.cfg.pass,
            lazyConnect: true,
        });
    }
    async init() {
        try {
            this.logger.info(`Connecting to Redis ${this.cfg.host}:${this.cfg.port}/${this.cfg.db}`);
            await this.client.connect();
            this.logger.info('Connected to Redis');
        }
        catch (err) {
            this.logger.error(`Failed to connect to Redis: ${(0, fast_safe_stringify_1.default)(err)}`);
            throw err;
        }
    }
    async start() {
        // do nothing
    }
    async stop() {
        this.logger.info('Disconnecting from Redis');
        this.client.disconnect();
        this.logger.info('Disconnected from Redis');
    }
}
exports.Redis = Redis;
