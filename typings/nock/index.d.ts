declare module 'nock' {
	const nock: {
		[k: string]: any;
		(...args: any[]): any;
	};

	export default nock;
}

declare namespace nock {
	export class Scope {
		restore(): void;
	}
}
