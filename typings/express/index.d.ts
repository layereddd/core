

// tslint:disable-next-line:no-namespace
declare namespace Express {

	// tslint:disable-next-line:interface-name
	export interface Request {
		id: string;
		target: string;
		rawBody?: Buffer;
		auth: {
			sessionId?: string;
			adminId?: string;
			phone?: string | null;
		};
	}

	export interface Response {
		responseData: any;
	}
}
