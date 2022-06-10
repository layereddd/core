import {Request} from 'express';

export const enum DefaultAuthType {
	None = 'None',
}

export interface IAuth {
	credentials (req: Request): Promise<any>;
	auth (req: Request, credentials: any): Promise<Request['auth']>;
}