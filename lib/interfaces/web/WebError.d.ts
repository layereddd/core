export declare class WebError extends Error {
    private type;
    statusCode: number;
    error: string;
    message: string;
    details?: any;
    origError?: Error;
    static from(err: any): WebError;
    constructor(statusCode: number, error?: string, message?: string, details?: any, origError?: Error);
    toJSON(): {
        type: string;
        error: string;
        statusCode: number;
        message: string;
        details?: any;
    };
    toString(): string;
}
