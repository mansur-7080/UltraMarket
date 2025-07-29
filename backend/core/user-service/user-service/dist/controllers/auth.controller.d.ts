export declare class AuthController {
    private emailService;
    private redisService;
    constructor();
    register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            user: any;
            accessToken: never;
            refreshToken: never;
        };
    }>;
    login(credentials: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
                id: any;
                email: any;
                firstName: any;
                lastName: any;
                phone: any;
                emailVerified: any;
                status: any;
                addresses: any;
                preferences: any;
            };
            accessToken: never;
            refreshToken: never;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        success: boolean;
        data: {
            accessToken: never;
            refreshToken: never;
        };
    }>;
    logout(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    } | undefined>;
    resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resendVerificationEmail(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        phone: any;
        emailVerified: any;
        status: any;
        addresses: any;
        preferences: any;
        createdAt: any;
        updatedAt: any;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateTokens;
}
//# sourceMappingURL=auth.controller.d.ts.map