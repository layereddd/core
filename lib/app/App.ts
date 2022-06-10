import {Logger} from './Logger';
import {IAsyncInit} from '../IAsyncInit';


export class App {

	constructor (
		private logger: Logger,
		private config: any,
		private initList: IAsyncInit[],
	) {
	}

	public async init (): Promise<void> {
		this.logger.info('init', {
			step:   'start',
			target: 'App',
		});
		this.logger.debug('init', {
			step:   'data',
			target: 'App',
			data:   {
				config: JSON.stringify(this.config),
			},
		});

		for (const obj of this.initList) {
			this.logger.info('init', {
				step:   'start',
				target: obj.constructor.name,
			});

			await obj.init();

			this.logger.info('init', {
				step:   'end',
				target: obj.constructor.name,
			});
		}

		this.logger.info('init', {
			step:   'end',
			target: 'App',
		});
	}

	public async start (): Promise<void> {
		this.logger.info('start', {
			step:   'start',
			target: 'App',
		});

		for (const obj of this.initList) {
			this.logger.info('start', {
				step:   'start',
				target: obj.constructor.name,
			});

			await obj.start();

			this.logger.info('start', {
				step:   'end',
				target: obj.constructor.name,
			});
		}

		this.logger.info('start', {
			step:   'end',
			target: 'App',
		});
	}

	public async stop (messages: unknown[] = []): Promise<void> {
		this.logger.info('stop', {
			step:   'start',
			target: 'App',
		});

		messages.forEach((message) => {
			if (message instanceof Error) {
				this.logger.error('stop', {
					step:   'data',
					target: 'App',
					error:  message,
				});
			} else {
				this.logger.info('stop', {
					step:   'data',
					target: 'App',
					data:   String(message),
				});
			}
		});

		for (let i = this.initList.length - 1; i >= 0; i -= 1) {
			const obj = this.initList[i];

			this.logger.info('stop', {
				step:   'start',
				target: obj.constructor.name,
			});

			await obj.stop();

			this.logger.info('stop', {
				step:   'end',
				target: obj.constructor.name,
			});
		}

		this.logger.info('stop', {
			step:   'end',
			target: 'App',
		});
	}
}
