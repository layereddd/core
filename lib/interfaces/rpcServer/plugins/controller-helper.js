"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyControllers = void 0;
const joi_1 = __importDefault(require("joi"));
const AppError_1 = require("../../../app/AppError");
const RpcError_1 = require("../RpcError");
function applyControllers(app) {
    const rpcServer = app.locals.rpcServer;
    Object.keys(app.locals.controllers).forEach((name) => {
        const controller = app.locals.controllers[name];
        Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((methodName) => {
            const method = controller[methodName];
            const methodData = Reflect.getMetadata('method:data', controller, methodName);
            if (!methodData) {
                return;
            }
            app.locals.logger.info(`RPC ${methodName}() - ${methodData.description}`);
            methodData.method = method.bind(controller);
            methodData.processReq = processReq(methodData);
            validate(app, methodData);
            if (app.locals.methods[methodName]) {
                throw new AppError_1.AppError('RPC METHOD DUPLICATE', `Method ${methodName} is duplicated`);
            }
            app.locals.methods[methodName] = methodData;
            rpcServer.method(methodName, methodData.processReq);
        });
    });
    app.use((req, res) => {
        const context = {
            headers: req.headers,
        };
        if (req.path !== '/') {
            const methodName = Object.keys(app.locals.methods).find((name) => {
                return app.locals.methods[name].path === req.path;
            });
            if (methodName) {
                req.body = {
                    jsonrpc: '2.0',
                    method: methodName,
                    params: {},
                    id: String(req.id),
                };
            }
        }
        rpcServer.call(req.body, context, (err, result) => {
            if (err) {
                res.locals.error = err.error;
                const methodData = app.locals.methods[req.body.method];
                let statusCode = 200;
                if (methodData && methodData.realStatusCode) {
                    statusCode = 400;
                }
                if (err instanceof RpcError_1.RpcError) {
                    return res.status(statusCode).send(err.toJSON());
                }
                else {
                    return res.status(statusCode).send(err);
                }
            }
            else {
                res.responseData = result;
                return res.send(result || {});
            }
        });
    });
}
exports.applyControllers = applyControllers;
const KEYS_FOR_VALIDATION = ['data', 'context'];
const VALIDATION_OPTIONS = {
    abortEarly: false,
    allowUnknown: false,
};
const methodSchema = joi_1.default.object().keys({
    description: joi_1.default.string().required(),
    validate: joi_1.default.object().required(),
    method: joi_1.default.func().required(),
    processReq: joi_1.default.func(),
    response: joi_1.default.object(),
    realStatusCode: joi_1.default.boolean().default(false),
    path: joi_1.default.string(),
});
function validate(app, methodData) {
    const result = methodSchema.validate(methodData);
    if (result.error) {
        app.locals.logger.fatal('Error on handler validation');
        throw result.error;
    }
}
function processReq(methodData) {
    return async function (data, context, next) {
        try {
            const args = {
                data: data || {},
                context: context,
            };
            KEYS_FOR_VALIDATION.forEach((key) => {
                const schema = methodData.validate[key];
                if (!schema) {
                    return args[key] = {};
                }
                const validationResult = schema.validate(args[key], VALIDATION_OPTIONS);
                args[key] = validationResult.value;
                if (validationResult.error) {
                    validationResult.error.inKey = key;
                    throw new RpcError_1.RpcError(400, `Request validation failed in ${key}`, {
                        appError: AppError_1.AppError.from(validationResult.error),
                    });
                }
            });
            const result = await methodData.method(args.data, args.context);
            return next(undefined, result);
        }
        catch (err) {
            if (err instanceof RpcError_1.RpcError || err.type === 'RpcError') {
                return next(err);
            }
            else if (err instanceof AppError_1.AppError || err.type === 'AppError') {
                const errData = err.toJSON();
                return next(new RpcError_1.RpcError(400, errData.message, { appError: errData }, err));
            }
            else {
                return next(new RpcError_1.RpcError(500, err.message, undefined, err));
            }
        }
    };
}
