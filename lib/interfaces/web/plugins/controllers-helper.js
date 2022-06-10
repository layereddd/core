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
exports.processControllers = void 0;
/* eslint-disable no-magic-numbers */
const express_1 = require("express");
const joi = __importStar(require("joi"));
const fs_1 = __importDefault(require("fs"));
const WebError_1 = require("../WebError");
const http_1 = require("http");
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const uploadFile = (0, multer_1.default)({ storage: storage }).any();
function processControllers(app) {
    app.locals.controllers.forEach((controller) => {
        const router = (0, express_1.Router)();
        const pathPrefix = controller.pathPrefix || '/';
        Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((handlerName) => {
            const handler = controller[handlerName];
            const handlerData = Reflect.getMetadata('handler:data', controller, handlerName);
            if (!handlerData) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            app.locals.logger.info(`Route ${handlerData.method} ${pathPrefix} ${handlerData.path} - ${handlerData.description}`);
            const method = handlerData.method.toLowerCase();
            const path = handlerData.path;
            handlerData.handler = handler.bind(controller);
            handlerData.processReq = processReq(handlerData);
            validate(app, handlerData);
            router[method](path, wrapAuth(app, handlerData), wrap(app, handlerData));
        });
        app.use(pathPrefix, router);
    });
}
exports.processControllers = processControllers;
const KEYS_FOR_VALIDATION = ['query', 'body', 'params', 'headers'];
const VALIDATION_OPTIONS = {
    abortEarly: false,
    allowUnknown: false,
};
const handlerSchema = joi.object().keys({
    description: joi.string().required(),
    method: joi.string().required(),
    path: joi.string().required(),
    auth: joi.string().required(),
    validate: joi.object().required(),
    handler: joi.func().required(),
    processReq: joi.func(),
    response: joi.object().required(),
    options: joi.object(),
});
function validate(app, handlerData) {
    const result = handlerSchema.validate(handlerData);
    if (result.error) {
        app.locals.logger.fatal('Error on handler validation');
        throw result.error;
    }
}
function processReq(handlerData) {
    return async function (req, res) {
        if (handlerData.options && handlerData.options.handleFile) {
            await new Promise((resolve) => {
                // Handling multipart/form-data
                // Adds a body object and a files object to the request object
                uploadFile(req, res, function (err) {
                    if (err) {
                        throw new WebError_1.WebError(500, "CAN'T LOAD FILE", "Can't load file");
                    }
                    resolve();
                });
            });
        }
        if (handlerData.validate) {
            KEYS_FOR_VALIDATION.forEach((key) => {
                const schema = handlerData.validate[key];
                if (!schema) {
                    return req[key] = {};
                }
                const validationResult = schema.validate(req[key], VALIDATION_OPTIONS);
                req[key] = validationResult.value;
                if (validationResult.error) {
                    const details = {
                        in: key,
                        errors: (validationResult.error.details || []).map((it) => {
                            return {
                                message: it.message,
                                key: (it.context || {}).key,
                                value: (it.context || {}).value,
                            };
                        }),
                    };
                    throw new WebError_1.WebError(400, 'VALIDATION ERROR', `Request validation failed in ${key}`, details);
                }
            });
        }
        return handlerData.handler(req, res);
    };
}
function wrapAuth(app, handlerData) {
    return async function (req, res, next) {
        try {
            if (handlerData.auth) {
                const auth = app.locals.auth[handlerData.auth];
                const credentials = await auth.credentials(req);
                /* eslint require-atomic-updates: 0 */
                req.auth = await auth.auth(req, credentials);
                return next();
            }
            else {
                return next();
            }
        }
        catch (err) {
            return next(err);
        }
    };
}
function wrap(app, handlerData) {
    return async function (req, res, next) {
        const logger = app.locals.logger;
        try {
            const data = await handlerData.processReq(req, res);
            if (res.headersSent) {
                return res;
            }
            if (handlerData.options && handlerData.options.sendFile) {
                if (data.filePath) {
                    logger.info('send file', {
                        step: 'start',
                        target: req.target,
                        data: {
                            filePath: data.filePath,
                        },
                    });
                    return res.status(200).sendFile(data.filePath, (err) => {
                        if (err) {
                            logger.warn('send file', {
                                step: 'end',
                                target: req.target,
                                data: {
                                    filePath: data.filePath,
                                },
                                error: err,
                            });
                        }
                        else {
                            logger.warn('send file', {
                                step: 'end',
                                target: req.target,
                                data: {
                                    filePath: data.filePath,
                                },
                            });
                        }
                        if (handlerData.options?.deleteAfterSend) {
                            logger.warn('delete file', {
                                step: 'start',
                                target: req.target,
                                data: {
                                    filePath: data.filePath,
                                },
                            });
                            fs_1.default.unlink(data.filePath, (fsErr) => {
                                if (fsErr) {
                                    logger.warn('delete file', {
                                        step: 'end',
                                        target: req.target,
                                        data: {
                                            filePath: data.filePath,
                                        },
                                        error: err,
                                    });
                                }
                                else {
                                    logger.warn('delete file', {
                                        step: 'end',
                                        target: req.target,
                                        data: {
                                            filePath: data.filePath,
                                        },
                                    });
                                }
                            });
                        }
                    });
                }
                if (data instanceof Buffer) {
                    res.setHeader('Content-type', 'application/pdf');
                    return res.send(data);
                }
                else {
                    return res.status(404).send(new WebError_1.WebError(404, 'FILE NOT FOUND', 'No file to send'));
                }
            }
            else if (handlerData.options?.redirect) {
                if (data.redirectLink) {
                    return res.redirect(302, data.redirectLink);
                }
                else {
                    return res.status(404).send(new WebError_1.WebError(404, 'REDIRECT NOT FOUND', 'No url to redirect'));
                }
            }
            else if (handlerData.options?.streamFile) {
                const requestFile = (0, http_1.request)(String(data));
                requestFile.end();
                requestFile.on('error', (err) => {
                    return next(err);
                });
                requestFile.on('response', (response) => {
                    if (typeof response.headers['content-type'] === 'string') {
                        res.setHeader('Content-type', response.headers['content-type']);
                    }
                    response.on('error', (err) => {
                        return next(err);
                    });
                    response.pipe(res);
                });
            }
            else if (handlerData.options?.rawResponse) {
                res.responseData = data;
                return res.status(200).send(data);
            }
            else {
                res.responseData = data;
                return res.status(200).send({
                    data: data,
                });
            }
        }
        catch (err) {
            return next(err);
        }
    };
}
