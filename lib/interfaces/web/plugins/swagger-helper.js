"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSwagger = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const joi_to_swagger_1 = __importDefault(require("joi-to-swagger"));
const lodash_1 = __importDefault(require("lodash"));
function registerSwagger(app) {
    const webCfg = app.locals.config.web;
    swaggerDocs.host = webCfg.appUrl;
    app.locals.controllers.forEach((controller) => {
        const controllerName = controller && controller.constructor.name || '';
        const tagName = controllerName.replace('Controller', '');
        swaggerDocs.tags.push({
            name: tagName,
        });
        Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((handlerName) => {
            const handlerData = Reflect.getMetadata('handler:data', controller, handlerName);
            if (!handlerData) {
                return;
            }
            let path = handlerData.path;
            const parameters = [];
            const validate = handlerData.validate;
            if (validate) {
                if (validate.body) {
                    const { swagger } = (0, joi_to_swagger_1.default)(validate.body);
                    parameters.push({
                        in: 'body',
                        name: 'body',
                        schema: swagger,
                    });
                }
                if (validate.query) {
                    const { swagger } = (0, joi_to_swagger_1.default)(validate.query);
                    lodash_1.default.each(swagger.properties, (property, queryName) => {
                        parameters.push({
                            ...property,
                            in: 'query',
                            name: queryName,
                        });
                    });
                }
                if (validate.params) {
                    const { swagger } = (0, joi_to_swagger_1.default)(validate.params);
                    lodash_1.default.each(swagger.properties, (property, paramName) => {
                        parameters.push({
                            ...property,
                            in: 'path',
                            name: paramName,
                        });
                        path = path.replace(`:${paramName}`, `{${paramName}}`);
                    });
                }
            }
            const handlerDoc = {
                tags: [tagName],
                summary: handlerData.description,
                description: handlerData.description,
                parameters: parameters,
                responses: {},
                security: [],
            };
            if (handlerData.auth !== "None" /* None */) {
                handlerDoc.security.push('basicAuth');
            }
            if (handlerData.response) {
                lodash_1.default.each(handlerData.response, (respObj, code) => {
                    const { swagger } = (0, joi_to_swagger_1.default)(respObj);
                    handlerDoc.responses[code] = {
                        description: code === '200' ? 'OK' : '',
                        schema: swagger,
                    };
                });
            }
            handlerDoc.responses = {
                ...handlerDoc.responses,
                ...errorResponses,
            };
            lodash_1.default.set(swaggerDocs.paths, [path, handlerData.method.toLowerCase()], handlerDoc);
        });
    });
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
}
exports.registerSwagger = registerSwagger;
const swaggerDocs = {
    swagger: '2.0',
    info: {
        title: 'API',
        version: '1.0.0',
    },
    basePath: '/',
    schemes: ['http', 'https'],
    tags: [],
    consumes: ['application/json'],
    produces: ['application/json'],
    paths: {},
    host: '',
    securityDefinitions: {
        basicAuth: {
            type: 'basic',
        },
    },
};
const errorSchema = {
    type: 'object',
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
        schema: errorSchema,
    },
    401: {
        description: 'Unauthorized',
        schema: errorSchema,
    },
    500: {
        description: 'Server error',
        schema: errorSchema,
    },
};
