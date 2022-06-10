import { Logger } from './Logger';
import { IAsyncInit } from '../IAsyncInit';
export declare class App {
    private logger;
    private config;
    private initList;
    constructor(logger: Logger, config: any, initList: IAsyncInit[]);
    init(): Promise<void>;
    start(): Promise<void>;
    stop(messages?: unknown[]): Promise<void>;
}
