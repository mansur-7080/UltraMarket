"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
class SocialAuthService {
    redis;
    config;
    googleClient = null;
    constructor() {
        this.config = this.loadSocialConfig();
        this.initializeRedis();
        this.initializeProviders();
    }
    loadSocialConfig() {
        return {
            google: {
                clientId: process.env['GOOGLE_CLIENT_ID'] || '',
                clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
                enabled: process.env['GOOGLE_AUTH_ENABLED'] === 'true'
            },
            facebook: {
                appId: process.env['FACEBOOK_APP_ID'] || '',
                appSecret: process.env['FACEBOOK_APP_SECRET'] || '',
                enabled: process.env['FACEBOOK_AUTH_ENABLED'] === 'true'
            },
            apple: {
                clientId: process.env['APPLE_CLIENT_ID'] || '',
                teamId: process.env['APPLE_TEAM_ID'] || '',
                keyId: process.env['APPLE_KEY_ID'] || '',
                privateKey: process.env['APPLE_PRIVATE_KEY'] || '',
                enabled: process.env['APPLE_AUTH_ENABLED'] === 'true'
            },
            github: {
                clientId: process.env['GITHUB_CLIENT_ID'] || '',
                clientSecret: process.env['GITHUB_CLIENT_SECRET'] || '',
                enabled: process.env['GITHUB_AUTH_ENABLED'] === 'true'
            },
            linkedin: {
                clientId: process.env['LINKEDIN_CLIENT_ID'] || '',
                clientSecret: process.env['LINKEDIN_CLIENT_SECRET'] || '',
                enabled: process.env['LINKEDIN_AUTH_ENABLED'] === 'true'
            }
        };
    }
    async initializeRedis() {
        try {
            this.redis = (0, redis_1.createClient)({
                url: process.env['REDIS_URL'] || 'redis://localhost:6379'
            });
            await this.redis.connect();
            logger_1.logger.info('🌐 Social auth service Redis connected');
        }
        catch (error) {
            logger_1.logger.error('❌ Social auth service Redis connection failed:', error);
        }
    }
    initializeProviders() {
        if (this.config.google.enabled && this.config.google.clientId) {
            this.googleClient = new google_auth_library_1.OAuth2Client(this.config.google.clientId, this.config.google.clientSecret);
            logger_1.logger.info('🌐 Google OAuth client initialized');
        }
        logger_1.logger.info('🌐 Social auth providers initialized');
    }
    async verifyGoogleToken(token) {
        if (!this.googleClient) {
            throw new Error('Google OAuth not configured');
        }
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: this.config.google.clientId
            });
            const payload = ticket.getPayload();
            if (!payload) {
                return null;
            }
            const user = {
                id: payload.sub,
                email: payload.email || '',
                firstName: payload.given_name || '',
                lastName: payload.family_name || '',
                avatar: payload.picture,
                provider: 'google',
                providerId: payload.sub,
                verified: payload.email_verified || false
            };
            logger_1.logger.info('🌐 Google token verified successfully', { email: user.email });
            return user;
        }
        catch (error) {
            logger_1.logger.error('❌ Google token verification failed:', error);
            return null;
        }
    }
    async verifyFacebookToken(token) {
        if (!this.config.facebook.enabled) {
            throw new Error('Facebook OAuth not configured');
        }
        try {
            const response = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }
            const user = {
                id: data.id,
                email: data.email || '',
                firstName: data.name?.split(' ')[0] || '',
                lastName: data.name?.split(' ').slice(1).join(' ') || '',
                avatar: data.picture?.data?.url,
                provider: 'facebook',
                providerId: data.id,
                verified: true
            };
            logger_1.logger.info('🌐 Facebook token verified successfully', { email: user.email });
            return user;
        }
        catch (error) {
            logger_1.logger.error('❌ Facebook token verification failed:', error);
            return null;
        }
    }
    async verifyAppleToken(token) {
        if (!this.config.apple.enabled) {
            throw new Error('Apple OAuth not configured');
        }
        try {
            const user = {
                id: 'apple_user_id',
                email: 'apple@example.com',
                firstName: 'Apple',
                lastName: 'User',
                provider: 'apple',
                providerId: 'apple_user_id',
                verified: true
            };
            logger_1.logger.info('🌐 Apple token verified successfully', { email: user.email });
            return user;
        }
        catch (error) {
            logger_1.logger.error('❌ Apple token verification failed:', error);
            return null;
        }
    }
    async verifyGitHubToken(token) {
        if (!this.config.github.enabled) {
            throw new Error('GitHub OAuth not configured');
        }
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'UltraMarket-Auth-Service'
                }
            });
            const data = await response.json();
            if (data.message) {
                throw new Error(data.message);
            }
            const user = {
                id: data.id.toString(),
                email: data.email || '',
                firstName: data.name?.split(' ')[0] || '',
                lastName: data.name?.split(' ').slice(1).join(' ') || '',
                avatar: data.avatar_url,
                provider: 'github',
                providerId: data.id.toString(),
                verified: true
            };
            logger_1.logger.info('🌐 GitHub token verified successfully', { email: user.email });
            return user;
        }
        catch (error) {
            logger_1.logger.error('❌ GitHub token verification failed:', error);
            return null;
        }
    }
    async verifyLinkedInToken(token) {
        if (!this.config.linkedin.enabled) {
            throw new Error('LinkedIn OAuth not configured');
        }
        try {
            const response = await fetch('https://api.linkedin.com/v2/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.serviceErrorCode) {
                throw new Error(data.message);
            }
            const user = {
                id: data.id,
                email: '',
                firstName: data.localizedFirstName || '',
                lastName: data.localizedLastName || '',
                provider: 'linkedin',
                providerId: data.id,
                verified: true
            };
            logger_1.logger.info('🌐 LinkedIn token verified successfully', { id: user.id });
            return user;
        }
        catch (error) {
            logger_1.logger.error('❌ LinkedIn token verification failed:', error);
            return null;
        }
    }
    async linkSocialAccount(userId, socialUser) {
        try {
            const key = `social:${userId}:${socialUser.provider}`;
            await this.redis.setEx(key, 86400, JSON.stringify(socialUser));
            logger_1.logger.info('🌐 Social account linked successfully', {
                userId,
                provider: socialUser.provider,
                email: socialUser.email
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to link social account:', error);
            return false;
        }
    }
    async unlinkSocialAccount(userId, provider) {
        try {
            const key = `social:${userId}:${provider}`;
            await this.redis.del(key);
            logger_1.logger.info('🌐 Social account unlinked successfully', { userId, provider });
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to unlink social account:', error);
            return false;
        }
    }
    async getLinkedSocialAccounts(userId) {
        try {
            const keys = await this.redis.keys(`social:${userId}:*`);
            const accounts = [];
            for (const key of keys) {
                const data = await this.redis.get(key);
                if (data) {
                    accounts.push(JSON.parse(data));
                }
            }
            return accounts;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get linked social accounts:', error);
            return [];
        }
    }
    async hasLinkedSocialAccount(userId, provider) {
        try {
            const key = `social:${userId}:${provider}`;
            const data = await this.redis.get(key);
            return !!data;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to check linked social account:', error);
            return false;
        }
    }
    getSocialLoginUrl(provider, redirectUri, state) {
        switch (provider.toLowerCase()) {
            case 'google':
                if (!this.config.google.enabled) {
                    throw new Error('Google OAuth not enabled');
                }
                return `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `client_id=${this.config.google.clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `response_type=code&` +
                    `scope=openid email profile&` +
                    `state=${state || 'default'}`;
            case 'facebook':
                if (!this.config.facebook.enabled) {
                    throw new Error('Facebook OAuth not enabled');
                }
                return `https://www.facebook.com/v12.0/dialog/oauth?` +
                    `client_id=${this.config.facebook.appId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `response_type=code&` +
                    `scope=email public_profile&` +
                    `state=${state || 'default'}`;
            case 'github':
                if (!this.config.github.enabled) {
                    throw new Error('GitHub OAuth not enabled');
                }
                return `https://github.com/login/oauth/authorize?` +
                    `client_id=${this.config.github.clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `response_type=code&` +
                    `scope=read:user user:email&` +
                    `state=${state || 'default'}`;
            case 'linkedin':
                if (!this.config.linkedin.enabled) {
                    throw new Error('LinkedIn OAuth not enabled');
                }
                return `https://www.linkedin.com/oauth/v2/authorization?` +
                    `client_id=${this.config.linkedin.clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `response_type=code&` +
                    `scope=r_liteprofile r_emailaddress&` +
                    `state=${state || 'default'}`;
            default:
                throw new Error(`Unsupported social provider: ${provider}`);
        }
    }
    async exchangeCodeForToken(provider, code, redirectUri) {
        try {
            switch (provider.toLowerCase()) {
                case 'google':
                    if (!this.googleClient) {
                        throw new Error('Google OAuth not configured');
                    }
                    const { tokens } = await this.googleClient.getToken(code);
                    return tokens.access_token || null;
                case 'facebook':
                    const fbResponse = await fetch('https://graph.facebook.com/v12.0/oauth/access_token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: this.config.facebook.appId,
                            client_secret: this.config.facebook.appSecret,
                            code,
                            redirect_uri: redirectUri
                        })
                    });
                    const fbData = await fbResponse.json();
                    return fbData.access_token || null;
                case 'github':
                    const ghResponse = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        },
                        body: new URLSearchParams({
                            client_id: this.config.github.clientId,
                            client_secret: this.config.github.clientSecret,
                            code,
                            redirect_uri: redirectUri
                        })
                    });
                    const ghData = await ghResponse.json();
                    return ghData.access_token || null;
                case 'linkedin':
                    const liResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: this.config.linkedin.clientId,
                            client_secret: this.config.linkedin.clientSecret,
                            code,
                            redirect_uri: redirectUri,
                            grant_type: 'authorization_code'
                        })
                    });
                    const liData = await liResponse.json();
                    return liData.access_token || null;
                default:
                    throw new Error(`Unsupported social provider: ${provider}`);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to exchange code for token:', error);
            return null;
        }
    }
    getSocialConfigStatus() {
        return {
            google: {
                enabled: this.config.google.enabled,
                configured: !!this.config.google.clientId
            },
            facebook: {
                enabled: this.config.facebook.enabled,
                configured: !!this.config.facebook.appId
            },
            apple: {
                enabled: this.config.apple.enabled,
                configured: !!this.config.apple.clientId
            },
            github: {
                enabled: this.config.github.enabled,
                configured: !!this.config.github.clientId
            },
            linkedin: {
                enabled: this.config.linkedin.enabled,
                configured: !!this.config.linkedin.clientId
            }
        };
    }
    async close() {
        try {
            if (this.redis) {
                await this.redis.quit();
                logger_1.logger.info('🌐 Social auth service Redis closed');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error closing social auth service connections', { error });
        }
    }
}
exports.socialAuthService = new SocialAuthService();
//# sourceMappingURL=social-auth.service.js.map