"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcServer = void 0;
const express_1 = __importDefault(require("express"));
const jayson = __importStar(require("jayson"));
const logger_1 = require("./plugins/logger");
const controllers_1 = require("./plugins/controllers");
class RpcServer {
    constructor(logger, config, container, controllersList) {
        this.logger = logger;
        this.config = config;
        this.container = container;
        this.controllersList = controllersList;
        this.cfg = this.config.rpcServer;
        this.app = (0, express_1.default)();
        this.rpcServer = new jayson.Server(undefined, { useContext: true });
    }
    async init() {
        this.app.locals.logger = this.logger;
        this.app.locals.config = this.config;
        this.app.locals.container = this.container;
        this.app.locals.rpcServer = this.rpcServer;
        this.app.set('trust proxy', true);
        this.app.use(express_1.default.json({
            limit: this.config.rpcServer.bodyLimit,
        }));
        await (0, logger_1.registerLogger)(this.app);
        await (0, controllers_1.registerControllers)(this.app, this.controllersList);
    }
    async start() {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        await new Promise((resolve, reject) => {
            this.logger.info(`rpcServer: starting ${this.cfg.port}`);
            this.server = this.app
                .listen(this.cfg.port, '0.0.0.0')
                .on('listening', () => {
                const address = this.server.address();
                this.logger.info(`rpcServer: stared ${address.port}`);
                return resolve();
            })
                .on('error', (err) => {
                this.logger.error('rpcServer: failed');
                return reject(err);
            });
        });
    }
    async stop() {
        if (this.server) {
            this.logger.info('rpcServer: closing');
            await new Promise((resolve) => {
                this.server.close(() => {
                    this.logger.info('rpcServer: closed');
                    return resolve();
                });
            });
        }
    }
    getPort() {
        const address = this.server.address();
        if (address) {
            return address.port;
        }
        else {
            return 0;
        }
    }
}
exports.RpcServer = RpcServer;
