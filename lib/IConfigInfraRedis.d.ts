export interface IConfigInfraRedis {
    infra: {
        redis: {
            host: string;
            port: number;
            db: number;
            pass: string;
        };
    };
}
