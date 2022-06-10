import { IConfigLogger } from '../IConfigLogger';
export declare class Logger {
    private config;
    private cfg;
    private logger;
    private context;
    constructor(config: IConfigLogger);
    get traceId(): string;
    get ids(): ILogData['ids'];
    trace(event: string, data?: ILogData): void;
    debug(event: string, data?: ILogData): void;
    info(event: string, data?: ILogData): void;
    warn(event: string, data?: ILogData): void;
    error(event: string, data?: ILogData): void;
    fatal(event: string, data?: ILogData): void;
    traceLogsWith(traceId: string, next: () => void): void;
    addIdsToTrace(ids: ILogData['ids']): void;
    private prepareLogObj;
    private prepareErrorString;
}
export interface ILogData {
    step: string;
    target: string;
    data?: string | {
        [key: string]: string | number | boolean | undefined | null;
    };
    ids?: {
        [key: string]: string | undefined | null;
    };
    error?: Error;
}
