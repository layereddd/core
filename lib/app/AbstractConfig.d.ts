export declare abstract class AbstractConfig {
    protected getNumber(key: string, defaultValue?: number): number;
    protected getString(key: string, defaultValue?: string): string;
    protected getBoolean(key: string, defaultValue?: boolean): boolean;
    protected getFile(key: string): string;
    protected getArrayString(key: string, defaultValue?: string[]): string[];
    protected getArrayNumber(key: string, defaultValue?: number[]): number[];
    protected getJSON(key: string, defaultValue?: any): any;
}
