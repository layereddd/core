import {STATUS_CODES} from 'http';
import stringify from 'fast-safe-stringify';
import _ from 'lodash';
import {AppError} from '../../app/AppError';


export class WebError extends Error {
	private type: string;
	public statusCode: number;
	public error: string;
	public message: string;
	public details?: any;
	public origError?: Error;

	public static from (err: any): WebError {
		if (err.type === 'RpcError') {
			if (err.code === 400) {
				const code      = _.get(err.data, 'appError.code', 'BAD DATA');
				const message   = _.get(err.data, 'appError.message', err.message);
				const details   = _.get(err.data, 'appError.details');

				return new WebError(400, code, message, details, err);

			} else {
				return new WebError(500, 'INTERNAL ERROR', err.message, undefined, err);
			}

		} else if (err instanceof AppError && err.code === 'ACCESS DENIED') {
			const errData = err.toJSON();
			return new WebError(400, errData.code, errData.message, errData.details, err);

		} else if (err instanceof AppError) {
			const errData = err.toJSON();

			return new WebError(500, errData.code, errData.message, errData.details, err);

		} else if (err instanceof WebError) {
			return err;

		} else {
			return new WebError(500, 'INTERNAL ERROR', 'Internal error', undefined, err);
		}
	}

	constructor (statusCode: number, error?: string, message?: string, details?: any, origError?: Error) {
		super();
		Error.captureStackTrace(this, this.constructor);

		this.statusCode = Number(statusCode) || 500;
		this.error      = (error || STATUS_CODES[this.statusCode] || 'UNKNOWN_WEB_ERROR').toUpperCase();
		this.details    = details ? JSON.parse(stringify(details)) : undefined;
		this.origError  = origError;
		this.type       = this.constructor.name;

		if (message) {
			this.message = message;
		} else {
			this.message = STATUS_CODES[this.statusCode] || 'UNKNOWN_WEB_ERROR';
		}
	}

	public toJSON (): {type: string; error: string; statusCode: number; message: string; details?: any} {
		return {
			type:       this.type,
			error:      this.error,
			statusCode: this.statusCode,
			message:    this.message,
			details:    this.details,
		};
	}

	public toString (): string {
		return `${this.type}: {` +
			`statusCode: ${this.statusCode}, ` +
			`error: ${this.error} ` +
			`message: ${this.message}, ` +
			`details: ${stringify(this.details)}, ` +
			`origError: ${stringify(this.origError)}` +
			'}';
	}
}
