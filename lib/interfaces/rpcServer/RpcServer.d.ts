import { AwilixContainer } from 'awilix';
import { Logger } from '../../app/Logger';
import { IAsyncInit } from '../../IAsyncInit';
import { IConfigRpcServer } from '../../IConfigRpcServer';
export declare class RpcServer implements IAsyncInit {
    private logger;
    private config;
    private container;
    private controllersList;
    private app;
    private server;
    private cfg;
    private rpcServer;
    constructor(logger: Logger, config: IConfigRpcServer, container: AwilixContainer, controllersList: any[]);
    init(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getPort(): number;
}
