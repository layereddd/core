import swaggerUi from 'swagger-ui-express';
import j2s from 'joi-to-swagger';
import _ from 'lodash';
import {Express} from 'express';
import {IHandlerData} from '../../decorators';
import {DefaultAuthType as AuthType} from '../../auth.types';


export function registerSwagger (app: Express): void {
	const webCfg = app.locals.config.web;

	swaggerDocs.host = webCfg.appUrl;


	app.locals.controllers.forEach((controller: any) => {
		const controllerName = controller && controller.constructor.name || '';

		const tagName = controllerName.replace('Controller', '');

		swaggerDocs.tags.push({
			name: tagName,
		});

		Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((handlerName) => {
			const handlerData: IHandlerData = Reflect.getMetadata('handler:data', controller, handlerName);

			if (!handlerData) {
				return;
			}

			let path = handlerData.path;
			const parameters = [];

			const validate = handlerData.validate;

			if (validate) {
				if (validate.body) {
					const { swagger } = j2s(validate.body as any);
					parameters.push({
						in:     'body',
						name:   'body',
						schema: swagger,
					});
				}

				if (validate.query) {
					const { swagger } = j2s(validate.query as any);
					_.each(swagger.properties, (property, queryName) => {
						parameters.push({
							...property,
							in:   'query',
							name: queryName,
						});
					});
				}

				if (validate.params) {
					const { swagger } = j2s(validate.params as any);
					_.each(swagger.properties, (property, paramName) => {
						parameters.push({
							...property,
							in:   'path',
							name: paramName,
						});

						path = path.replace(`:${paramName}`, `{${paramName}}`);
					});
				}
			}

			const handlerDoc = {
				tags:        [tagName],
				summary:     handlerData.description,
				description: handlerData.description,
				parameters:  parameters,
				responses:   {},
				security:    [],
			};

			if (handlerData.auth !== AuthType.None) {
				(handlerDoc.security as any).push('basicAuth');
			}

			if (handlerData.response) {
				_.each(handlerData.response, (respObj, code) => {
					const { swagger } = j2s(respObj as any);

					(handlerDoc.responses as any)[code] = {
						description: code === '200' ? 'OK' : '',
						schema:      swagger,
					};
				});
			}

			handlerDoc.responses = {
				...handlerDoc.responses,
				...errorResponses,
			};

			_.set(swaggerDocs.paths, [path, handlerData.method.toLowerCase()], handlerDoc);
		});
	});

	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

const swaggerDocs = {
	swagger: '2.0',
	info:    {
		title:   'API',
		version: '1.0.0',
	},
	basePath: '/',
	schemes:  ['http', 'https'],
	tags:     [] as { name: string }[],

	consumes: ['application/json'],
	produces: ['application/json'],

	paths: {},
	host:  '',

	securityDefinitions: {
		basicAuth: {
			type: 'basic',
		},
	},
};

const errorSchema = {
	type:       'object',
	properties: {
		statusCode: {
			type: 'integer',
		},
		error: {
			type: 'string',
		},
		details: {
			type: 'string',
		},
	},
};

const errorResponses = {
	400: {
		description: 'Bad request',
		schema:      errorSchema,
	},
	401: {
		description: 'Unauthorized',
		schema:      errorSchema,
	},
	500: {
		description: 'Server error',
		schema:      errorSchema,
	},
};
