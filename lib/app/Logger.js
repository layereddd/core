"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const log4js_1 = __importDefault(require("log4js"));
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
const cls_hooked_1 = __importDefault(require("cls-hooked"));
const lodash_1 = __importDefault(require("lodash"));
class Logger {
    constructor(config) {
        this.config = config;
        this.cfg = this.config.logger;
        this.context = cls_hooked_1.default.createNamespace('app');
        const [appender, level = 'info'] = this.cfg.loggingType.split(':');
        log4js_1.default.addLayout('json', () => {
            return (logEvent) => {
                return (0, fast_safe_stringify_1.default)({
                    ts: logEvent.startTime.getTime(),
                    level: logEvent.level.levelStr,
                    dataObj: typeof logEvent.data[0] === 'string' ? { data: logEvent.data[0] } : logEvent.data[0],
                });
            };
        });
        log4js_1.default.addLayout('simple', () => {
            return (logEvent) => {
                return `${Number(logEvent.startTime)} [${logEvent.level.levelStr}] ${(0, fast_safe_stringify_1.default)(logEvent.data[0])}`;
            };
        });
        log4js_1.default.configure({
            appenders: {
                default: {
                    type: 'stdout',
                    layout: {
                        type: 'colored',
                    },
                },
                simple: {
                    type: 'stdout',
                    layout: {
                        type: 'simple',
                    },
                },
                json: {
                    type: 'stdout',
                    layout: {
                        type: 'json',
                    },
                },
            },
            categories: {
                default: {
                    appenders: ['default'],
                    level: level,
                },
                json: {
                    appenders: ['json'],
                    level: level,
                },
                simple: {
                    appenders: ['simple'],
                    level: level,
                },
            },
            pm2: this.cfg.pm2,
        });
        this.logger = log4js_1.default.getLogger(appender);
        this.trace('trace test log');
        this.debug('debug test log');
        this.info('info test log');
        this.warn('warn test log');
        this.error('error test log');
        this.fatal('fatal test log');
    }
    get traceId() {
        return String(this.context.get('traceId') || '');
    }
    get ids() {
        return this.context.get('ids') || {};
    }
    trace(event, data) {
        const logObj = this.prepareLogObj(event, data);
        return this.logger.trace(logObj);
    }
    debug(event, data) {
        const logObj = this.prepareLogObj(event, data);
        return this.logger.debug(logObj);
    }
    info(event, data) {
        const logObj = this.prepareLogObj(event, data);
        return this.logger.info(logObj);
    }
    warn(event, data) {
        const logObj = this.prepareLogObj(event, data);
        return this.logger.warn(logObj);
    }
    error(event, data) {
        const logObj = this.prepareLogObj(event, data);
        return this.logger.error(logObj);
    }
    fatal(event, data) {
        const logObj = this.prepareLogObj(event, data);
        return this.logger.fatal(logObj);
    }
    traceLogsWith(traceId, next) {
        this.context.run(() => {
            this.context.set('traceId', traceId);
            next();
        });
    }
    addIdsToTrace(ids) {
        this.context.set('ids', {
            ...this.ids,
            ...ids,
        });
    }
    prepareLogObj(event, data) {
        const dataArr = [];
        if (!data) {
            dataArr.push(event);
            event = 'log';
        }
        if (data?.data) {
            dataArr.push(JSON.stringify(data.data));
        }
        if (data?.ids) {
            dataArr.push(JSON.stringify(data.ids));
        }
        if (data?.error) {
            dataArr.push(this.prepareErrorString(data.error));
        }
        return {
            traceId: this.traceId,
            event: event,
            step: data?.step ?? 'log',
            target: data?.target ?? 'log',
            data: dataArr.join('; '),
            ids: lodash_1.default.omitBy({
                ...this.ids,
                ...data?.ids,
            }, lodash_1.default.isNil.bind(lodash_1.default)),
        };
    }
    prepareErrorString(err) {
        return (0, fast_safe_stringify_1.default)({
            type: err.type || null,
            name: err.name || null,
            message: err.message || null,
            ...err,
            stack: err.stack || null,
            origError: err.origError || null,
            sourceError: err.origError?.origError?.toString() || null,
        });
    }
}
exports.Logger = Logger;
