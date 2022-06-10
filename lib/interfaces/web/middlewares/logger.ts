import {Express, Response} from 'express';
import {ILogData, Logger} from '../../../app/Logger';
import {MaskSensitiveInfo} from '../../../app/utils/MaskSensitiveInfo';
import _ from 'lodash';


export function registerLogger (app: Express): void {
	const prefix = Math.random().toString(36).toUpperCase().substr(-4);
	let counter = 0;

	// Register logger for every request
	app.use((req: any, res: Response, next: () => void) => {
		const logger: Logger = app.locals.logger;

		counter += 1;
		const count = counter.toString(36).toUpperCase().padStart(6, '0');
		req.id        = `${prefix}_${count}`;
		req.createdAt = req.createdAt || Date.now();
		req.target    = `${req.method.toUpperCase()} ${req.path}`;

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
				step:   'start',
				target: req.target,
				ids:    {
					...bodyIds,
					...queryIds,
					...paramsIds,
					ip: req.ip,
				},
			});

			let maskRawBody: any;
			if (req.rawBody) {
				maskRawBody = _.isString(req.rawBody) ? req.rawBody.substr(0, 100) : JSON.stringify(req.rawBody).substr(0, 100);
			}

			logger.debug('web request', {
				step:   'data',
				target: req.target,
				data:   {
					query:      JSON.stringify(MaskSensitiveInfo.hideSensitiveData(req.query)),
					params:     JSON.stringify(MaskSensitiveInfo.hideSensitiveData(req.params)),
					body:       JSON.stringify(MaskSensitiveInfo.hideSensitiveData(req.body))?.substr(0, 1000),
					rawBody:    maskRawBody,
					bodyLength: req.rawBody?.byteLength || 0,
					headers:    JSON.stringify(req.headers)?.substr(0, 1000),
				},
			});

			res.on('finish', () => {
				logger.debug('web request', {
					step:   'response',
					target: req.target,
					data:   {
						data: JSON.stringify(MaskSensitiveInfo.hideSensitiveData(res.responseData)),
					},
				});

				if (res.statusCode >= 500) {
					logger.error('web request', {
						step:   'end',
						target: req.target,
						data:   {
							statusCode:    res.statusCode,
							contentLength: String(res.getHeader('content-length')),
							duration:      Date.now() - req.createdAt,
						},
					});
				} else if (res.statusCode >= 400) {
					logger.warn('web request', {
						step:   'end',
						target: req.target,
						data:   {
							statusCode:    res.statusCode,
							contentLength: String(res.getHeader('content-length')),
							duration:      Date.now() - req.createdAt,
						},
					});
				} else {
					logger.info('web request', {
						step:   'end',
						target: req.target,
						data:   {
							statusCode:    res.statusCode,
							contentLength: String(res.getHeader('content-length')),
							duration:      Date.now() - req.createdAt,
						},
						ids: getIds(res.responseData),
					});
				}
			});

			return next();
		});
	});
}

function getIds (data?: any): ILogData['ids'] | undefined {
	if (!data) {
		return undefined;
	}

	const keysForLogging = Object.keys(data).filter((key) => {
		return key.length >= 3 && key.endsWith('Id');
	});

	if (!keysForLogging.length) {
		return undefined;
	}

	return keysForLogging.reduce<ILogData['ids']>((acc, key) => {
		acc![key] = data[key];

		return acc;
	}, {});
}
