interface SecurityHeaders {
    hsts: {
        enabled: boolean;
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    csp: {
        enabled: boolean;
        directives: Record<string, string[]>;
    };
    xss: {
        enabled: boolean;
        mode: 'block' | 'sanitize';
    };
    frameOptions: {
        enabled: boolean;
        action: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
        uri?: string;
    };
}
declare class SSLConfiguration {
    private sslConfig;
    private securityHeaders;
    constructor();
    private loadSSLConfig;
    private loadSecurityHeaders;
    getSSLOptions(): any;
    getSecurityHeaders(): SecurityHeaders;
    getHSTSHeader(): string | null;
    getCSPHeader(): string | null;
    getXSSProtectionHeader(): string | null;
    getFrameOptionsHeader(): string | null;
    validateSSLConfig(): {
        isValid: boolean;
        errors: string[];
    };
    getSSLStatus(): any;
    getSecurityHeadersStatus(): any;
}
export declare const sslConfig: SSLConfiguration;
export {};
//# sourceMappingURL=ssl.config.d.ts.map