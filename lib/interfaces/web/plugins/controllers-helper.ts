/* eslint-disable no-magic-numbers */
import {Express, Request, Router} from 'express';
import * as joi from 'joi';
import fs from 'fs';
import {WebError} from '../WebError';
import {IHandlerData} from '../../decorators';
import {IAuth} from '../../auth.types';
import {Logger} from '../../../app/Logger';
import {request} from 'http';
import multer from 'multer';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage }).any();

export function processControllers (app: Express): void {
	app.locals.controllers.forEach((controller: any) => {
		const router = Router();

		const pathPrefix = controller.pathPrefix || '/';

		Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((handlerName) => {
			const handler = controller[handlerName];

			const handlerData: IHandlerData = Reflect.getMetadata('handler:data', controller, handlerName);

			if (!handlerData) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			app.locals.logger.info(`Route ${handlerData.method} ${pathPrefix} ${handlerData.path} - ${handlerData.description}`);

			const method = handlerData.method.toLowerCase();
			const path   = handlerData.path;

			handlerData.handler = handler.bind(controller);
			handlerData.processReq = processReq(handlerData);

			validate(app, handlerData);
			(router as any)[method](path, wrapAuth(app, handlerData), wrap(app, handlerData));
		});

		app.use(pathPrefix, router);
	});
}


const KEYS_FOR_VALIDATION = ['query', 'body', 'params', 'headers'];
const VALIDATION_OPTIONS = {
	abortEarly:   false,
	allowUnknown: false,
};

const handlerSchema = joi.object().keys({
	description: joi.string().required(),
	method:      joi.string().required(),
	path:        joi.string().required(),
	auth:        joi.string().required(),
	validate:    joi.object().required(),
	handler:     joi.func().required(),
	processReq:  joi.func(),
	response:    joi.object().required(),
	options:     joi.object(),
});

function validate (app: Express, handlerData: any): void {
	const result = handlerSchema.validate(handlerData);

	if (result.error) {
		app.locals.logger.fatal('Error on handler validation');
		throw result.error;
	}
}

function processReq (handlerData: IHandlerData) {
	return async function (req: any, res: any): Promise<any> {
		if (handlerData.options && handlerData.options.handleFile) {
			await new Promise<void>((resolve) => {
				// Handling multipart/form-data
				// Adds a body object and a files object to the request object
				uploadFile(req, res, function (err: any) {
					if (err) {
						throw new WebError(500, "CAN'T LOAD FILE", "Can't load file");
					}

					resolve();
				});
			});
		}

		if (handlerData.validate) {
			KEYS_FOR_VALIDATION.forEach((key) => {
				const schema = (handlerData.validate as any)[key];

				if (!schema) {
					return req[key] = {};
				}

				const validationResult = schema.validate(req[key], VALIDATION_OPTIONS);

				req[key] = validationResult.value;

				if (validationResult.error) {
					const details = {
						in:     key,
						errors: (validationResult.error.details || []).map((it: any) => {
							return {
								message: it.message,
								key:     (it.context || {}).key,
								value:   (it.context || {}).value,
							};
						}),
					};
					throw new WebError(400, 'VALIDATION ERROR', `Request validation failed in ${key}`, details);
				}
			});
		}

		return handlerData.handler!(req, res);
	};
}

function wrapAuth (app: Express, handlerData: IHandlerData) {
	return async function (req: Request, res: Response, next: (err?: Error) => void) {
		try {
			if (handlerData.auth) {
				const auth: IAuth = app.locals.auth[handlerData.auth];

				const credentials = await auth.credentials(req);

				/* eslint require-atomic-updates: 0 */
				req.auth = await auth.auth(req, credentials);

				return next();
			} else {
				return next();
			}
		} catch (err: any) {
			return next(err);
		}
	};
}

function wrap (app: Express, handlerData: IHandlerData) {
	return async function (req: Request, res: any, next: (err?: Error) => void): Promise<Response | void> {
		const logger: Logger = app.locals.logger;

		try {
			const data = await handlerData.processReq!(req, res);

			if (res.headersSent) {
				return res;
			}

			if (handlerData.options && handlerData.options.sendFile) {
				if (data.filePath) {
					logger.info('send file', {
						step:   'start',
						target: req.target,
						data:   {
							filePath: data.filePath,
						},
					});

					return res.status(200).sendFile(data.filePath, (err: any) => {
						if (err) {
							logger.warn('send file', {
								step:   'end',
								target: req.target,
								data:   {
									filePath: data.filePath,
								},
								error: err,
							});

						} else {
							logger.warn('send file', {
								step:   'end',
								target: req.target,
								data:   {
									filePath: data.filePath,
								},
							});
						}

						if (handlerData.options?.deleteAfterSend) {
							logger.warn('delete file', {
								step:   'start',
								target: req.target,
								data:   {
									filePath: data.filePath,
								},
							});

							fs.unlink(data.filePath, (fsErr) => {
								if (fsErr) {
									logger.warn('delete file', {
										step:   'end',
										target: req.target,
										data:   {
											filePath: data.filePath,
										},
										error: err,
									});
								} else {
									logger.warn('delete file', {
										step:   'end',
										target: req.target,
										data:   {
											filePath: data.filePath,
										},
									});
								}
							});
						}
					});
				} if (data instanceof Buffer) {
					res.setHeader('Content-type', 'application/pdf');
					return res.send(data);
				} else {
					return res.status(404).send(new WebError(404, 'FILE NOT FOUND', 'No file to send'));
				}
			} else if (handlerData.options?.redirect) {
				if (data.redirectLink) {
					return res.redirect(302, data.redirectLink);
				} else {
					return res.status(404).send(new WebError(404, 'REDIRECT NOT FOUND', 'No url to redirect'));
				}
			} else if (handlerData.options?.streamFile) {
				const requestFile = request(String(data));
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
			} else if (handlerData.options?.rawResponse) {
				res.responseData = data;
				return res.status(200).send(data);
			} else {
				res.responseData = data;

				return res.status(200).send({
					data: data,
				});
			}

		} catch (err: any) {
			return next(err);
		}
	};
}
