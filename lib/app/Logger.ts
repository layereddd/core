import log4js from 'log4js';
import stringify from 'fast-safe-stringify';
import cls from 'cls-hooked';
import _ from 'lodash';
import {IConfigLogger} from '../IConfigLogger';


export class Logger {
	private cfg: IConfigLogger['logger'];
	private logger: log4js.Logger;
	private context: cls.Namespace;

	constructor (
		private config: IConfigLogger,
	) {
		this.cfg = this.config.logger;

		this.context = cls.createNamespace('app');

		const [appender, level = 'info'] = this.cfg.loggingType.split(':');

		log4js.addLayout('json', () => {
			return (logEvent) => {
				return stringify({
					ts:      logEvent.startTime.getTime(),
					level:   logEvent.level.levelStr,
					dataObj: typeof logEvent.data[0] === 'string' ? {data: logEvent.data[0]} : logEvent.data[0],
				});
			};
		});
		log4js.addLayout('simple', () => {
			return (logEvent) => {
				return `${Number(logEvent.startTime)} [${logEvent.level.levelStr}] ${stringify(logEvent.data[0])}`;
			};
		});
		log4js.configure({
			appenders: {
				default: {
					type:   'stdout',
					layout: {
						type: 'colored',
					},
				},
				simple: {
					type:   'stdout',
					layout: {
						type: 'simple',
					},
				},
				json: {
					type:   'stdout',
					layout: {
						type: 'json',
					},
				},
			},
			categories: {
				default: {
					appenders: ['default'],
					level:     level,
				},
				json: {
					appenders: ['json'],
					level:     level,
				},
				simple: {
					appenders: ['simple'],
					level:     level,
				},
			},
			pm2: this.cfg.pm2,
		});

		this.logger = log4js.getLogger(appender);

		this.trace('trace test log');
		this.debug('debug test log');
		this.info('info test log');
		this.warn('warn test log');
		this.error('error test log');
		this.fatal('fatal test log');
	}

	public get traceId (): string {
		return String(this.context.get('traceId') || '');
	}

	public get ids (): ILogData['ids'] {
		return this.context.get('ids') || {};
	}

	public trace (event: string, data?: ILogData): void {
		const logObj = this.prepareLogObj(event, data);

		return this.logger.trace(logObj);
	}

	public debug (event: string, data?: ILogData): void {
		const logObj = this.prepareLogObj(event, data);

		return this.logger.debug(logObj);
	}

	public info (event: string, data?: ILogData): void {
		const logObj = this.prepareLogObj(event, data);

		return this.logger.info(logObj);
	}

	public warn (event: string, data?: ILogData): void {
		const logObj = this.prepareLogObj(event, data);

		return this.logger.warn(logObj);
	}

	public error (event: string, data?: ILogData): void {
		const logObj = this.prepareLogObj(event, data);

		return this.logger.error(logObj);
	}

	public fatal (event: string, data?: ILogData): void {
		const logObj = this.prepareLogObj(event, data);

		return this.logger.fatal(logObj);
	}

	public traceLogsWith (traceId: string, next: () => void): void {
		this.context.run(() => {
			this.context.set('traceId', traceId);

			next();
		});
	}

	public addIdsToTrace (ids: ILogData['ids']): void {
		this.context.set('ids', {
			...this.ids,
			...ids,
		});
	}

	private prepareLogObj (event: string, data?: ILogData): any {
		const dataArr: string[] = [];

		if (!data) {
			dataArr.push(event);
			event = 'log';
		}

		if (data?.data) {
			dataArr.push(JSON.stringify(data.data));
		}

		if (data?.ids) {
			dataArr.push(JSON.stringify(data.ids));
		}

		if (data?.error) {
			dataArr.push(this.prepareErrorString(data.error));
		}

		return {
			traceId: this.traceId,
			event:   event,
			step:    data?.step ?? 'log',
			target:  data?.target ?? 'log',
			data:    dataArr.join('; '),
			ids:     _.omitBy({
				...this.ids,
				...data?.ids,
			}, _.isNil.bind(_)),
		};
	}

	private prepareErrorString (err: any): string {
		return stringify({
			type:        err.type || null,
			name:        err.name || null,
			message:     err.message || null,
			...err,
			stack:       err.stack || null,
			origError:   err.origError || null,
			sourceError: err.origError?.origError?.toString() || null,
		});
	}
}

export interface ILogData {
	step: string;
	target: string;
	data?: string | {
		[key: string]: string | number | boolean | undefined | null;
	};
	ids?: {
		[key: string]: string | undefined | null;
	};
	error?: Error;
}
