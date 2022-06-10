import redis from 'ioredis';
import stringify from 'fast-safe-stringify';
import {IAsyncInit} from '../../IAsyncInit';
import {IConfigInfraRedis} from '../../IConfigInfraRedis';
import {Logger} from '../../app/Logger';
import {AppError} from '../../app/AppError';


export class Redis implements IAsyncInit {
	private cfg: IConfigInfraRedis['infra']['redis'];
	public client: redis;

	constructor (
		private logger: Logger,
		private config: IConfigInfraRedis,
	) {
		if (!this.config.infra.redis) {
			throw new AppError('INVALID CONFIG', 'Missing config for Redis');
		}

		this.cfg = this.config.infra.redis;

		this.client = new redis({
			host:        this.cfg.host,
			port:        this.cfg.port,
			db:          this.cfg.db,
			password:    this.cfg.pass,
			lazyConnect: true,
		});
	}

	public async init () {
		try {
			this.logger.info(`Connecting to Redis ${this.cfg.host}:${this.cfg.port}/${this.cfg.db}`);

			await this.client.connect();

			this.logger.info('Connected to Redis');

		} catch (err) {
			this.logger.error(`Failed to connect to Redis: ${stringify(err)}`);

			throw err;
		}
	}

	public async start () {
		// do nothing
	}

	public async stop () {
		this.logger.info('Disconnecting from Redis');
		this.client.disconnect();
		this.logger.info('Disconnected from Redis');
	}
}
