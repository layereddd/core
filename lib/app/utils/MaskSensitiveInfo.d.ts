export declare class MaskSensitiveInfo {
    static REPLACE_TO_DICT: {
        [key: string]: string;
    };
    /**
     * @param data - Array or Object
     * @returns data with masked sensitive info
     */
    static hideSensitiveData(data: Record<string, any> | Array<any> | any): any;
    private static findAndMask;
}
