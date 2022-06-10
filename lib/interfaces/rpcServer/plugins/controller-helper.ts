import {Express, Request} from 'express';
import joi from 'joi';
import * as jayson from 'jayson';
import {IMethodData} from '../../decorators';
import {AppError} from '../../../app/AppError';
import {RpcError} from '../RpcError';


export function applyControllers (app: Express): void {
	const rpcServer: jayson.Server = app.locals.rpcServer;

	Object.keys(app.locals.controllers).forEach((name) => {
		const controller = app.locals.controllers[name];

		Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((methodName) => {
			const method = controller[methodName];

			const methodData: IMethodData = Reflect.getMetadata('method:data', controller, methodName);

			if (!methodData) {
				return;
			}

			app.locals.logger.info(`RPC ${methodName}() - ${methodData.description}`);

			methodData.method     = method.bind(controller);
			methodData.processReq = processReq(methodData);

			validate(app, methodData);

			if (app.locals.methods[methodName]) {
				throw new AppError('RPC METHOD DUPLICATE', `Method ${methodName} is duplicated`);
			}

			app.locals.methods[methodName] = methodData;
			rpcServer.method(methodName, methodData.processReq);
		});
	});

	app.use((req: Request, res: any) => {
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
					method:  methodName,
					params:  {},
					id:      String((req as any).id),
				};
			}
		}

		(rpcServer.call as any)(req.body, context, (err: any, result: any) => {
			if (err) {
				res.locals.error = err.error;

				const methodData: IMethodData = app.locals.methods[req.body.method];
				let statusCode = 200;

				if (methodData && methodData.realStatusCode) {
					statusCode = 400;
				}

				if (err instanceof RpcError) {
					return res.status(statusCode).send(err.toJSON());
				} else {
					return res.status(statusCode).send(err);
				}
			} else {
				res.responseData = result;

				return res.send(result || {});
			}
		});
	});
}

const KEYS_FOR_VALIDATION = ['data', 'context'];
const VALIDATION_OPTIONS = {
	abortEarly:   false,
	allowUnknown: false,
};

const methodSchema = joi.object().keys({
	description:    joi.string().required(),
	validate:       joi.object().required(),
	method:         joi.func().required(),
	processReq:     joi.func(),
	response:       joi.object(),
	realStatusCode: joi.boolean().default(false),
	path:           joi.string(),
});


function validate (app: Express, methodData: any): joi.ValidationResult<any> | void {
	const result = methodSchema.validate(methodData);

	if (result.error) {
		app.locals.logger.fatal('Error on handler validation');
		throw result.error;
	}
}

function processReq (methodData: IMethodData) {
	return async function (data: any, context: any, next: (err?: Error, result?: any) => void): Promise<any> {
		try {
			const args: any = {
				data:    data || {},
				context: context,
			};

			KEYS_FOR_VALIDATION.forEach((key) => {
				const schema = (methodData.validate as any)[key];

				if (!schema) {
					return args[key] = {};
				}

				const validationResult = schema.validate(args[key], VALIDATION_OPTIONS);
				args[key] = validationResult.value;

				if (validationResult.error) {
					validationResult.error.inKey = key;

					throw new RpcError(400, `Request validation failed in ${key}`, {
						appError: AppError.from(validationResult.error),
					});
				}
			});

			const result = await methodData.method!(args.data, args.context);

			return next(undefined, result);

		} catch (err: any) {
			if (err instanceof RpcError || err.type === 'RpcError') {
				return next(err);

			} else if (err instanceof AppError || err.type === 'AppError') {
				const errData = err.toJSON();

				return next(new RpcError(400, errData.message, { appError: errData }, err));
			} else {
				return next(new RpcError(500, err.message, undefined, err));
			}
		}
	};
}
