import { Request, Response, NextFunction, Application } from 'express';
export declare enum SecurityErrorCodes {
    RATE_LIMIT_EXCEEDED = "SEC_001",
    IP_BLOCKED = "SEC_002",
    SUSPICIOUS_ACTIVITY = "SEC_003",
    SQL_INJECTION_ATTEMPT = "SEC_004",
    XSS_ATTEMPT = "SEC_005",
    CSRF_VIOLATION = "SEC_006",
    PATH_TRAVERSAL_ATTEMPT = "SEC_007",
    DATA_EXFILTRATION_ATTEMPT = "SEC_008",
    INVALID_AUTHENTICATION = "SEC_009",
    UNAUTHORIZED_ACCESS = "SEC_010",
    MALFORMED_REQUEST = "SEC_011",
    SECURITY_HEADER_VIOLATION = "SEC_012"
}
export declare const applyUserServiceSecurity: (app: Application) => void;
export declare const correlationTrackingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const professionalSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const threatDetectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const userSpecificSecurityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const userDataProtectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticationSecurityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityAuditMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    applyUserServiceSecurity: (app: Application) => void;
    userSpecificSecurityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    userDataProtectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    authenticationSecurityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    correlationTrackingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    professionalSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
    threatDetectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    securityAuditMiddleware: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=security.middleware.d.ts.map