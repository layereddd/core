export declare class AppError extends Error {
    code: string;
    message: string;
    details?: any;
    origError?: Error | undefined;
    private type;
    private origErrorStack?;
    static from(err: any): AppError;
    constructor(code: string, message: string, details?: any, origError?: Error | undefined);
    toJSON(): {
        type: string;
        code: string;
        message: string;
        details?: any;
        origError: any;
    };
    toString(): string;
}
