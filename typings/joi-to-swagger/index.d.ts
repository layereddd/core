declare function j2s (schema: any, existingComponents?: any): any;

declare module 'joi-to-swagger' {
	export = j2s;
}
