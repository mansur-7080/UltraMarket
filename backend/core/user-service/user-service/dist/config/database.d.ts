export declare const prisma: any;
export declare const config: {
    database: {
        url: string;
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    redis: {
        url: string;
        host: string;
        port: number;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    email: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        s3: {
            bucket: string;
        };
    };
    twilio: {
        accountSid: string;
        authToken: string;
        phoneNumber: string;
    };
};
export declare const testConnection: () => Promise<boolean>;
export declare const disconnectDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map