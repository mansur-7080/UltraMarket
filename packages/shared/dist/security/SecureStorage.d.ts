/**
 * 🔐 ULTRAMARKET SECURE STORAGE
 * Enterprise-grade secure storage for sensitive data
 * @version 2.0.0
 * @author UltraMarket Security Team
 */
interface SecureStorageConfig {
    encryptionKey?: string;
    useSessionStorage?: boolean;
    enableCompression?: boolean;
    keyPrefix?: string;
    expiration?: number;
    enableIntegrityCheck?: boolean;
}
interface StorageItem {
    data: string;
    timestamp: number;
    expiration?: number;
    checksum?: string;
    compressed?: boolean;
}
export declare class UltraMarketSecureStorage {
    private config;
    private storage;
    constructor(config?: SecureStorageConfig);
    private generateDefaultKey;
    private getFullKey;
    private createStorageItem;
    private parseStorageItem;
    setItem(key: string, value: any, customExpiration?: number): Promise<void>;
    getItem<T = any>(key: string): Promise<T | null>;
    removeItem(key: string): void;
    clear(): void;
    getAllKeys(): string[];
    hasItem(key: string): Promise<boolean>;
    private cleanupExpiredItems;
    setAuthTokens(tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }): Promise<void>;
    getAuthTokens(): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    } | null>;
    clearAuthTokens(): void;
    isTokenValid(): Promise<boolean>;
    setUserData(userData: any): Promise<void>;
    getUserData<T = any>(): Promise<T | null>;
    clearUserData(): void;
    rotateEncryptionKey(newKey: string): void;
    exportData(): Promise<Record<string, any>>;
    importData(data: Record<string, any>): Promise<void>;
    getStorageStats(): {
        totalItems: number;
        totalSize: number;
        oldestItem: number;
        newestItem: number;
    };
}
export declare const secureStorage: UltraMarketSecureStorage;
export type { SecureStorageConfig, StorageItem };
export declare const createSecureStorage: (config?: SecureStorageConfig) => UltraMarketSecureStorage;
export default UltraMarketSecureStorage;
//# sourceMappingURL=SecureStorage.d.ts.map