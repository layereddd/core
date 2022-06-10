import 'reflect-metadata';
import {SchemaLike} from 'joi';
import {Request} from 'express';


export interface IMethodData {
	description: string;
	validate: {
		data?: SchemaLike;
		context?: SchemaLike;
	};
	path?: string; // Path for some probe requests
	realStatusCode?: boolean;
	method?: (req: any, context: any) => any;
	processReq?: (data: any, context: any, next: (err?: Error, result?: any) => void) => any;
}

export function method (methodData: IMethodData) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		Reflect.defineMetadata('method:data', methodData, target, propertyKey);
	};
}

export interface IHandlerData {
	description: string;
	method: 'GET' | 'POST' | 'PUT' |'PATCH' | 'DELETE';
	auth?: any;
	path: string;
	validate: {
		query?: SchemaLike;
		body?: SchemaLike;
		params?: SchemaLike;
		headers?: SchemaLike;
	};
	response: {
		[statusCode: number]: SchemaLike;
	};
	options?: {
		sendFile?: boolean;
		deleteAfterSend?: boolean;
		redirect?: boolean;
		streamFile?: boolean;
		rawResponse?: boolean;
		handleFile?: boolean;
	};
	handler?: (req: any, res: any) => any;
	processReq?: (req: any, res?: any) => any;
}

export interface RequestObj extends Request {
	query: {
		[key: string]: any;
	};
	body: {
		[key: string]: any;
	};
	params: {
		[key: string]: any;
	};
	files?: any;
}
