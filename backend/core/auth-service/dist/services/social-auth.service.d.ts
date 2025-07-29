interface SocialUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    provider: string;
    providerId: string;
    verified: boolean;
}
declare class SocialAuthService {
    private redis;
    private config;
    private googleClient;
    constructor();
    private loadSocialConfig;
    private initializeRedis;
    private initializeProviders;
    verifyGoogleToken(token: string): Promise<SocialUser | null>;
    verifyFacebookToken(token: string): Promise<SocialUser | null>;
    verifyAppleToken(token: string): Promise<SocialUser | null>;
    verifyGitHubToken(token: string): Promise<SocialUser | null>;
    verifyLinkedInToken(token: string): Promise<SocialUser | null>;
    linkSocialAccount(userId: string, socialUser: SocialUser): Promise<boolean>;
    unlinkSocialAccount(userId: string, provider: string): Promise<boolean>;
    getLinkedSocialAccounts(userId: string): Promise<SocialUser[]>;
    hasLinkedSocialAccount(userId: string, provider: string): Promise<boolean>;
    getSocialLoginUrl(provider: string, redirectUri: string, state?: string): string;
    exchangeCodeForToken(provider: string, code: string, redirectUri: string): Promise<string | null>;
    getSocialConfigStatus(): any;
    close(): Promise<void>;
}
export declare const socialAuthService: SocialAuthService;
export {};
//# sourceMappingURL=social-auth.service.d.ts.map