import express from 'express';
import http from 'http';
import {AddressInfo} from 'net';
import {Express} from 'express';
import * as jayson from 'jayson';
import {AwilixContainer} from 'awilix';
import {registerLogger} from './plugins/logger';
import {Logger} from '../../app/Logger';
import {registerControllers} from './plugins/controllers';
import {IAsyncInit} from '../../IAsyncInit';
import {IConfigRpcServer} from '../../IConfigRpcServer';


export class RpcServer implements IAsyncInit {
	private app: Express;
	private server!: http.Server;
	private cfg!: IConfigRpcServer['rpcServer'];
	private rpcServer!: jayson.Server;

	constructor (
		private logger: Logger,
		private config: IConfigRpcServer,
		private container: AwilixContainer,
		private controllersList: any[],
	) {
		this.cfg = this.config.rpcServer;
		this.app = express();
		this.rpcServer = new jayson.Server(undefined, {useContext: true});
	}

	public async init () {
		this.app.locals.logger    = this.logger;
		this.app.locals.config    = this.config;
		this.app.locals.container = this.container;
		this.app.locals.rpcServer = this.rpcServer;

		this.app.set('trust proxy', true);

		this.app.use(express.json({
			limit: this.config.rpcServer.bodyLimit,
		}));

		await registerLogger(this.app);
		await registerControllers(this.app, this.controllersList);
	}

	public async start () {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		await new Promise<void>((resolve, reject) => {
			this.logger.info(`rpcServer: starting ${this.cfg.port}`);

			this.server = this.app
			.listen(this.cfg.port, '0.0.0.0')
			.on('listening', () => {
				const address = this.server.address() as AddressInfo;

				this.logger.info(`rpcServer: stared ${address.port}`);

				return resolve();
			})
			.on('error', (err) => {
				this.logger.error('rpcServer: failed');

				return reject(err);
			});
		});
	}

	public async stop () {
		if (this.server) {
			this.logger.info('rpcServer: closing');

			await new Promise<void>((resolve) => {
				this.server.close(() => {
					this.logger.info('rpcServer: closed');

					return resolve();
				});
			});
		}
	}

	public getPort () {
		const address = this.server.address() as AddressInfo;

		if (address) {
			return address.port;
		} else {
			return 0;
		}
	}
}
