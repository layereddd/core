import _ from 'lodash';

export class MaskSensitiveInfo {
	public static REPLACE_TO_DICT: {[key: string]: string} = {
		otpCode:  '****',
		code:     '****',
		password: '****',
	};

	/**
	 * @param data - Array or Object
	 * @returns data with masked sensitive info
	 */
	public static hideSensitiveData (data: Record<string, any> | Array<any> | any): any {
		const clone = _.cloneDeep(data);

		return MaskSensitiveInfo.findAndMask(clone);
	}

	private static findAndMask (data: Record<string, any> | Array<any>): any {
		if (_.isObject(data)) {
			_.forIn(data, (value, key) => {
				if (MaskSensitiveInfo.REPLACE_TO_DICT[key]) { // replace value for dictionary value
					_.update(data, key, () => {
						return MaskSensitiveInfo.REPLACE_TO_DICT[key];
					});
				} else if (_.isArray(value)) { // going deeper into the array
					for (const iterator of (value as any)) {
						MaskSensitiveInfo.findAndMask(iterator);
					}
				} else if (_.isObject(value)) { // going deeper into the object
					MaskSensitiveInfo.findAndMask(value);
				}
			});
		} else if (_.isArray(data)) {
			for (const iterator of (data as Array<any>)) {
				MaskSensitiveInfo.findAndMask(iterator);
			}
		}
		return data;
	}
}
