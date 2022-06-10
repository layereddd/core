"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogger = void 0;
const MaskSensitiveInfo_1 = require("../../../app/utils/MaskSensitiveInfo");
const lodash_1 = __importDefault(require("lodash"));
function registerLogger(app) {
    const prefix = Math.random().toString(36).toUpperCase().substr(-4);
    let counter = 0;
    // Register logger for every request
    app.use((req, res, next) => {
        const logger = app.locals.logger;
        counter += 1;
        const count = counter.toString(36).toUpperCase().padStart(6, '0');
        req.id = `${prefix}_${count}`;
        req.createdAt = req.createdAt || Date.now();
        req.target = `${req.method.toUpperCase()} ${req.path}`;
        res.setHeader('X-Trace-Id', req.id);
        logger.traceLogsWith(req.id, () => {
            const doLog = req.path !== '/ping';
            if (!doLog) {
                return next();
            }
            const bodyIds = getIds(req.body);
            const queryIds = getIds(req.query);
            const paramsIds = getIds(req.params);
            logger.info('web request', {
                step: 'start',
                target: req.target,
                ids: {
                    ...bodyIds,
                    ...queryIds,
                    ...paramsIds,
                    ip: req.ip,
                },
            });
            let maskRawBody;
            if (req.rawBody) {
                maskRawBody = lodash_1.default.isString(req.rawBody) ? req.rawBody.substr(0, 100) : JSON.stringify(req.rawBody).substr(0, 100);
            }
            logger.debug('web request', {
                step: 'data',
                target: req.target,
                data: {
                    query: JSON.stringify(MaskSensitiveInfo_1.MaskSensitiveInfo.hideSensitiveData(req.query)),
                    params: JSON.stringify(MaskSensitiveInfo_1.MaskSensitiveInfo.hideSensitiveData(req.params)),
                    body: JSON.stringify(MaskSensitiveInfo_1.MaskSensitiveInfo.hideSensitiveData(req.body))?.substr(0, 1000),
                    rawBody: maskRawBody,
                    bodyLength: req.rawBody?.byteLength || 0,
                    headers: JSON.stringify(req.headers)?.substr(0, 1000),
                },
            });
            res.on('finish', () => {
                logger.debug('web request', {
                    step: 'response',
                    target: req.target,
                    data: {
                        data: JSON.stringify(MaskSensitiveInfo_1.MaskSensitiveInfo.hideSensitiveData(res.responseData)),
                    },
                });
                if (res.statusCode >= 500) {
                    logger.error('web request', {
                        step: 'end',
                        target: req.target,
                        data: {
                            statusCode: res.statusCode,
                            contentLength: String(res.getHeader('content-length')),
                            duration: Date.now() - req.createdAt,
                        },
                    });
                }
                else if (res.statusCode >= 400) {
                    logger.warn('web request', {
                        step: 'end',
                        target: req.target,
                        data: {
                            statusCode: res.statusCode,
                            contentLength: String(res.getHeader('content-length')),
                            duration: Date.now() - req.createdAt,
                        },
                    });
                }
                else {
                    logger.info('web request', {
                        step: 'end',
                        target: req.target,
                        data: {
                            statusCode: res.statusCode,
                            contentLength: String(res.getHeader('content-length')),
                            duration: Date.now() - req.createdAt,
                        },
                        ids: getIds(res.responseData),
                    });
                }
            });
            return next();
        });
    });
}
exports.registerLogger = registerLogger;
function getIds(data) {
    if (!data) {
        return undefined;
    }
    const keysForLogging = Object.keys(data).filter((key) => {
        return key.length >= 3 && key.endsWith('Id');
    });
    if (!keysForLogging.length) {
        return undefined;
    }
    return keysForLogging.reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
    }, {});
}
