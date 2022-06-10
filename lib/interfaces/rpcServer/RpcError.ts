import stringify from 'fast-safe-stringify';


export class RpcError extends Error {
	public type: string;
	private origErrorStack?: string;

	constructor (
		public code: number,
		public message: string,
		public data?: any,
		public origError?: Error,
	) {
		super();
		Error.captureStackTrace(this, this.constructor);

		this.type = this.constructor.name;

		this.origErrorStack = this.origError?.stack;
	}

	public toJSON (): {type: string; code: number; message: string; data?: any} {
		return {
			type:    this.type,
			code:    this.code,
			message: this.message,
			data:    this.data,
		};
	}

	public toString (): string {
		return `${this.type}: { ` +
			`type: "${this.type}", ` +
			`code: ${this.code}, ` +
			`message: "${this.message}", ` +
			`data: "${stringify(this.data)}" ` +
			`stack: "${this.stack}", ` +
			`origError: "${stringify(this.origError)}" ` +
			'}';
	}
}
