import { Logger } from '../../app/Logger';
import { IAsyncInit } from '../../IAsyncInit';
import { IConfigTimer } from '../../IConfigTimer';
import { ITicker } from '../../ITicker';
export declare class Timer implements IAsyncInit {
    private logger;
    private config;
    private tickersList;
    private cfg;
    private isStopped;
    constructor(logger: Logger, config: IConfigTimer, tickersList: ITicker[]);
    init(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    private process;
}
