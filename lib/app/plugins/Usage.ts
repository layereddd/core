import {Logger} from '../Logger';
import {IAsyncInit} from '../../IAsyncInit';
import {IConfigUsage} from '../../IConfigUsage';


export class Usage implements IAsyncInit {
	private cfg: IConfigUsage['usage'];
	private timer!: NodeJS.Timeout;
	private cpuUsage: NodeJS.CpuUsage;

	constructor (
		private logger: Logger,
		private config: IConfigUsage,
	) {
		this.cfg = this.config.usage;
		this.cpuUsage = process.cpuUsage();
	}

	public async init (): Promise<void> {
		// do nothing
	}

	public async start (): Promise<void> {
		this.timer = setInterval(() => {
			const cpuUsage = process.cpuUsage();
			const memUsage = process.memoryUsage();

			this.logger.info('usage', {
				step:   'data',
				target: 'memory',
				data:   {
					value: Object.keys(memUsage).map((key) => {
						const val = Math.floor(memUsage[key as keyof NodeJS.MemoryUsage] / 1024 / 1024);

						return `${key}: ${val}`;
					}).join(', '),
				},
			});
			this.logger.info('usage', {
				step:   'data',
				target: 'cpu',
				data:   {
					value: Object.keys(cpuUsage).map((key) => {
						const val = ((cpuUsage[key as keyof NodeJS.CpuUsage] - this.cpuUsage[key as keyof NodeJS.CpuUsage]) / 1e4 / this.cfg.interval).toFixed(2);

						return `${key}: ${val}`;
					}).join(', '),
				},
			});

			this.cpuUsage = cpuUsage;
		}, this.cfg.interval * 1000);
	}

	public async stop (): Promise<void> {
		clearInterval(this.timer);
	}
}
