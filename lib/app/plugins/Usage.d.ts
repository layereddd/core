import { Logger } from '../Logger';
import { IAsyncInit } from '../../IAsyncInit';
import { IConfigUsage } from '../../IConfigUsage';
export declare class Usage implements IAsyncInit {
    private logger;
    private config;
    private cfg;
    private timer;
    private cpuUsage;
    constructor(logger: Logger, config: IConfigUsage);
    init(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
