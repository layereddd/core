import {Express} from 'express';
import {ILogData, Logger} from '../../../app/Logger';
import { MaskSensitiveInfo } from '../../../app/utils/MaskSensitiveInfo';


export async function registerLogger (app: Express): Promise<void> {
	const prefix = Math.random().toString(36).toUpperCase().substr(-4);
	let counter = 0;

	// Register logger for every request
	app.use((req: any, res: any, next: () => void) => {
		req.createdAt = req.createdAt || Date.now();
		req.target = req.body.method && `${req.body.method}()` || '';

		const doLog = req.path !== '/ping';

		if (!doLog) {
			req.id = req.body.id || null;
			return next();
		}

		// TraceId
		counter += 1;
		const count = counter.toString(36).toUpperCase().padStart(6, '0');
		req.id = req.body.id || `${prefix}_${count}`;
		res.setHeader('X-Trace-Id', req.id);

		const logger: Logger = app.locals.logger;

		logger.traceLogsWith(req.id, () => {
			logger.info('rpc request', {
				step:   'start',
				target: req.target,
				ids:    getIds(req.body.params),
			});

			logger.debug('rpc request', {
				step:   'data',
				target: req.target,
				data:   {
					query:   JSON.stringify(MaskSensitiveInfo.hideSensitiveData(req.query)),
					body:    JSON.stringify(MaskSensitiveInfo.hideSensitiveData(req.body)).substr(0, 1000),
					headers: JSON.stringify(req.headers).substr(0, 1000),
				},
			});

			res.on('finish', () => {
				logger.debug('rpc request', {
					step:   'response',
					target: req.target,
					data:   {
						data: JSON.stringify(MaskSensitiveInfo.hideSensitiveData(res.responseData))?.substr(0, 1000) || '',
					},
				});


				if (res.locals.error) {
					if (res.locals.error.code === 400) {
						logger.warn('rpc request', {
							step:   'end',
							target: req.target,
							data:   {
								errCode:       res.locals.error.code,
								errMessage:    res.locals.error.message,
								contentLength: String(res.getHeader('content-length')),
								duration:      Date.now() - req.createdAt,
								path:          (req.path !== '/' && req.path !== '/ping') ? req.path : undefined,
							},
							error: res.locals.error,
						});
					} else {
						logger.error('rpc request', {
							step:   'end',
							target: req.target,
							data:   {
								errCode:       res.locals.error.code,
								errMessage:    res.locals.error.message,
								contentLength: String(res.getHeader('content-length')),
								duration:      Date.now() - req.createdAt,
								path:          (req.path !== '/' && req.path !== '/ping') ? req.path : undefined,
							},
							error: res.locals.error,
						});
					}
				} else {
					logger.info('rpc request', {
						step:   'end',
						target: req.target,
						data:   {
							contentLength: String(res.getHeader('content-length')),
							duration:      Date.now() - req.createdAt,
							path:          (req.path !== '/' && req.path !== '/ping') ? req.path : undefined,
						},
						ids: getIds(res.responseData && res.responseData.result),
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
