export declare class RpcError extends Error {
    code: number;
    message: string;
    data?: any;
    origError?: Error | undefined;
    type: string;
    private origErrorStack?;
    constructor(code: number, message: string, data?: any, origError?: Error | undefined);
    toJSON(): {
        type: string;
        code: number;
        message: string;
        data?: any;
    };
    toString(): string;
}
