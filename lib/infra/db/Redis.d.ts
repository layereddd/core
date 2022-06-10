import redis from 'ioredis';
import { IAsyncInit } from '../../IAsyncInit';
import { IConfigInfraRedis } from '../../IConfigInfraRedis';
import { Logger } from '../../app/Logger';
export declare class Redis implements IAsyncInit {
    private logger;
    private config;
    private cfg;
    client: redis;
    constructor(logger: Logger, config: IConfigInfraRedis);
    init(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
