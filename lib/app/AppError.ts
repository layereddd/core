import _ from 'lodash';
import stringify from 'fast-safe-stringify';


export class AppError extends Error {
	private type: string;
	private origErrorStack?: string;

	static from (err: any): AppError {
		if (err instanceof AppError) {
			return err;

		} else if (err && err.type === 'AppError') {
			return new AppError(
				String(err.code || 'UNKNOWN APP ERROR'),
				String(err.message || 'Unknown error'),
				err.details,
				err,
			);

		} else if (err instanceof Error) {
			const generalErr: any = err;

			if (generalErr.isJoi) {
				const inKey      = _.get(generalErr, 'inKey', '_');
				const errDetails = _.get(generalErr, 'details');
				const errList = (Array.isArray(errDetails) ? errDetails : [])
				.filter(Boolean)
				.map((it) => {
					return {
						message: it.message,
						key:     (it.context || {}).key,
						value:   (it.context || {}).value,
					};
				});

				return new AppError('VALIDATION ERROR', `Validation failed for ${inKey}`, {in: inKey, errors: errList}, generalErr);

			} else {
				return new AppError('INTERNAL ERROR', 'Internal error', undefined, err);
			}

		} else {
			return new AppError('UNKNOWN ERROR', 'Unknown error', undefined, err);
		}
	}

	constructor (
		public code: string,
		public message: string,
		public details?: any,
		public origError?: Error,
	) {
		super();
		Error.captureStackTrace(this, this.constructor);

		this.details = this.details ? JSON.parse(stringify(details)) : undefined;
		this.type    = this.constructor.name;
		this.code    = this.code.toUpperCase();

		this.origErrorStack = this.origError?.stack;
	}

	public toJSON (): {type: string; code: string; message: string; details?: any; origError: any} {
		return {
			type:      this.type,
			code:      this.code,
			message:   this.message,
			details:   this.details,
			origError: this.origError,
		};
	}

	public toString (): string {
		return `${this.type}: { ` +
			`type: "${this.type}", ` +
			`code: "${this.code}", ` +
			`message: "${this.message}", ` +
			`details: "${stringify(this.details)}", ` +
			`stack: "${this.stack}", ` +
			`origError: "${stringify(this.origError)}" ` +
			'}';
	}
}

