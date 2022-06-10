import {Logger} from '../../app/Logger';
import {IAsyncInit} from '../../IAsyncInit';
import {IConfigTimer} from '../../IConfigTimer';
import {ITicker} from '../../ITicker';


export class Timer implements IAsyncInit {
	private cfg!: IConfigTimer['timer'];
	private isStopped!: boolean;

	constructor (
		private logger: Logger,
		private config: IConfigTimer,
		private tickersList: ITicker[],
	) {
		this.cfg = this.config.timer;
		this.isStopped = false;
	}

	public async init (): Promise<void> {
		// do nothing
	}

	public async start (): Promise<void> {
		setTimeout(async () => {
			await this.process();
		}, this.cfg.interval).unref();
	}

	public async stop (): Promise<void> {
		this.isStopped = true;
	}

	private async process (): Promise<void> {
		if (this.isStopped) {
			return;
		}

		try {
			for (const ticker of this.tickersList) {
				await ticker.tick();
			}

		} catch (err: any) {
			this.logger.error('Timer process error');
			this.logger.error(err.toString());
		}

		setTimeout(async () => {
			await this.process();
		}, this.cfg.interval).unref();
	}
}
