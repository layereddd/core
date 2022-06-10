import {Express, Request, Response} from 'express';
import {WebError} from '../WebError';
import {Logger} from '../../../app/Logger';
import {AppError} from '../../../app/AppError';


export function registerErrorHandler (app: Express): void {
	// It is need to be the last middleware !!!
	const logger: Logger = app.locals.logger;

	app.use((req, res, next) => { // 404
		return next(new WebError(404));
	});

	app.use((err: Error, req: Request, res: Response, next: () => void) => {
		let webError: WebError;

		if (err instanceof WebError) {
			logger.warn('web requests', {
				step:   'error',
				target: req.target,
				error:  err,
			});
			webError = err;

		} else if (err.name === 'PayloadTooLargeError') {
			webError = new WebError(413);
		} else if (err.name === 'SyntaxError') {
			webError = new WebError(400, 'Validation Error', 'Invalid JSON');
		} else if (err.message === 'You have exceeded your request limit') {
			if (err instanceof AppError) {
				const errData = err.toJSON();

				webError = new WebError(429, err.name, errData.message, errData.details, err);
			} else {
				webError = new WebError(429, err.name, err.message);
			}
		} else {
			if (!((err as any)?.type === 'RpcError')) {
				logger.error('web request', {
					step:   'error',
					target: req.target,
					data:   'Unhandled controller error',
					error:  err,
				});
			}

			webError = WebError.from(err);
		}

		const errData = webError.toJSON();

		const statusCode = Number(errData.statusCode) || 500;

		if (statusCode >= 500) {
			app.locals.logger.error(webError);
		}

		res.status(statusCode);

		res.send({
			statusCode: errData.statusCode,
			error:      errData.error,
			message:    errData.message,
			details:    errData.details,
		});
	});
}
