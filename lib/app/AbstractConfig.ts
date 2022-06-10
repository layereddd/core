import fs from 'fs';


export abstract class AbstractConfig {
	protected getNumber (key: string, defaultValue?: number): number {
		const value = process.env[key];

		if (value === undefined) {
			if (defaultValue !== undefined) {
				return defaultValue;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain valid number. Got undefined`);
			}
		}

		if (value === '') {
			throw new TypeError(`Config key "${key}" MUST contain valid number. Got ""`);
		}

		const num = Number(value);

		if (Number.isFinite(num)) {
			return num;
		} else {
			throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value}"`);
		}
	}

	protected getString (key: string, defaultValue?: string): string {
		const value = process.env[key];

		if (value === undefined) {
			if (defaultValue !== undefined) {
				return defaultValue;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain string. Got undefined`);
			}
		}

		return value;
	}

	protected getBoolean (key: string, defaultValue?: boolean): boolean {
		const value = process.env[key];

		if (value === undefined) {
			if (defaultValue !== undefined) {
				return defaultValue;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain valid boolean (true, false). Got undefined`);
			}
		}

		if (value === 'true') {
			return true;
		} else if (value === 'false') {
			return false;
		} else {
			throw new TypeError(`Config key "${key}" MUST contain valid boolean (true, false). Got "${value}"`);
		}
	}

	protected getFile (key: string): string {
		const value = process.env[key];

		if (value === undefined) {
			throw new TypeError(`Config key "${key}" MUST contain path to file. Got undefined`);
		}

		if (value === '') {
			throw new TypeError(`Config key "${key}" MUST contain path to file. Got ""`);
		}

		try {
			return fs.readFileSync(value, { encoding: 'utf8' });

		} catch (err: any) {
			throw new TypeError(`File reading of config key "${key}" with value ${value} fails with error: ${err.message}`);
		}
	}

	protected getArrayString (key: string, defaultValue?: string[]): string[] {
		const value = process.env[key];

		if (value === undefined) {
			if (defaultValue !== undefined) {
				return defaultValue;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain string. Got undefined`);
			}
		}

		return value.split(',');
	}

	protected getArrayNumber (key: string, defaultValue?: number[]): number[] {
		const value = process.env[key];

		if (value === undefined) {
			if (defaultValue !== undefined) {
				return defaultValue;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain valid number. Got undefined`);
			}
		}

		if (value === '') {
			throw new TypeError(`Config key "${key}" MUST contain valid number. Got ""`);
		}

		return value.split(',').map((item) => {
			const num = Number(item);

			if (Number.isFinite(num)) {
				return num;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain valid number. Got "${value}"`);
			}
		});
	}

	protected getJSON (key: string, defaultValue?: any): any {
		const value = process.env[key];
		let parsed: any;

		if (value === undefined) {
			if (defaultValue !== undefined) {
				return defaultValue;
			} else {
				throw new TypeError(`Config key "${key}" MUST contain valid json string. Got undefined`);
			}
		}

		try {
			parsed = JSON.parse(value);
		} catch (err) {
			throw new TypeError(`Config key "${key}" MUST contain valid json string. Got "${value}"`);
		}

		return parsed;
	}
}
