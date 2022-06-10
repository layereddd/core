"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaskSensitiveInfo = void 0;
const lodash_1 = __importDefault(require("lodash"));
class MaskSensitiveInfo {
    /**
     * @param data - Array or Object
     * @returns data with masked sensitive info
     */
    static hideSensitiveData(data) {
        const clone = lodash_1.default.cloneDeep(data);
        return MaskSensitiveInfo.findAndMask(clone);
    }
    static findAndMask(data) {
        if (lodash_1.default.isObject(data)) {
            lodash_1.default.forIn(data, (value, key) => {
                if (MaskSensitiveInfo.REPLACE_TO_DICT[key]) { // replace value for dictionary value
                    lodash_1.default.update(data, key, () => {
                        return MaskSensitiveInfo.REPLACE_TO_DICT[key];
                    });
                }
                else if (lodash_1.default.isArray(value)) { // going deeper into the array
                    for (const iterator of value) {
                        MaskSensitiveInfo.findAndMask(iterator);
                    }
                }
                else if (lodash_1.default.isObject(value)) { // going deeper into the object
                    MaskSensitiveInfo.findAndMask(value);
                }
            });
        }
        else if (lodash_1.default.isArray(data)) {
            for (const iterator of data) {
                MaskSensitiveInfo.findAndMask(iterator);
            }
        }
        return data;
    }
}
exports.MaskSensitiveInfo = MaskSensitiveInfo;
MaskSensitiveInfo.REPLACE_TO_DICT = {
    otpCode: '****',
    code: '****',
    password: '****',
};
