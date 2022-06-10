"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorHandler = void 0;
const WebError_1 = require("../WebError");
const AppError_1 = require("../../../app/AppError");
function registerErrorHandler(app) {
    // It is need to be the last middleware !!!
    const logger = app.locals.logger;
    app.use((req, res, next) => {
        return next(new WebError_1.WebError(404));
    });
    app.use((err, req, res, next) => {
        let webError;
        if (err instanceof WebError_1.WebError) {
            logger.warn('web requests', {
                step: 'error',
                target: req.target,
                error: err,
            });
            webError = err;
        }
        else if (err.name === 'PayloadTooLargeError') {
            webError = new WebError_1.WebError(413);
        }
        else if (err.name === 'SyntaxError') {
            webError = new WebError_1.WebError(400, 'Validation Error', 'Invalid JSON');
        }
        else if (err.message === 'You have exceeded your request limit') {
            if (err instanceof AppError_1.AppError) {
                const errData = err.toJSON();
                webError = new WebError_1.WebError(429, err.name, errData.message, errData.details, err);
            }
            else {
                webError = new WebError_1.WebError(429, err.name, err.message);
            }
        }
        else {
            if (!(err?.type === 'RpcError')) {
                logger.error('web request', {
                    step: 'error',
                    target: req.target,
                    data: 'Unhandled controller error',
                    error: err,
                });
            }
            webError = WebError_1.WebError.from(err);
        }
        const errData = webError.toJSON();
        const statusCode = Number(errData.statusCode) || 500;
        if (statusCode >= 500) {
            app.locals.logger.error(webError);
        }
        res.status(statusCode);
        res.send({
            statusCode: errData.statusCode,
            error: errData.error,
            message: errData.message,
            details: errData.details,
        });
    });
}
exports.registerErrorHandler = registerErrorHandler;
