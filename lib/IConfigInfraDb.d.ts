export interface IConfigInfraDb {
    infra: {
        db: {
            host: string;
            port: number;
            db: string;
            user: string;
            pass: string;
            dialect: string;
        };
    };
}
