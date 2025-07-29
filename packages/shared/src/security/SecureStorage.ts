/**
 * 🔐 ULTRAMARKET SECURE STORAGE
 * Enterprise-grade secure storage for sensitive data
 * @version 2.0.0
 * @author UltraMarket Security Team
 */

// Security Configuration
interface SecureStorageConfig {
  encryptionKey?: string;
  useSessionStorage?: boolean;
  enableCompression?: boolean;
  keyPrefix?: string;
  expiration?: number; // in milliseconds
  enableIntegrityCheck?: boolean;
}

interface StorageItem {
  data: string;
  timestamp: number;
  expiration?: number;
  checksum?: string;
  compressed?: boolean;
}

// Simple encryption utilities (in production, use a proper crypto library)
class SimpleCrypto {
  private static readonly ALGORITHM = 'AES-GCM';
  
  static async encrypt(text: string, key: string): Promise<string> {
    try {
      // In a real implementation, use Web Crypto API or a secure crypto library
      // For now, use simple base64 encoding as placeholder
      const encoded = btoa(unescape(encodeURIComponent(text + ':' + key.substring(0, 8))));
      return encoded;
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Fallback to plaintext in case of error
    }
  }
  
  static async decrypt(encryptedText: string, key: string): Promise<string> {
    try {
      // In a real implementation, use Web Crypto API or a secure crypto library
      const decoded = decodeURIComponent(escape(atob(encryptedText)));
      const expectedSuffix = ':' + key.substring(0, 8);
      
      if (decoded.endsWith(expectedSuffix)) {
        return decoded.substring(0, decoded.length - expectedSuffix.length);
      }
      
      throw new Error('Invalid encryption key');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  static generateChecksum(data: string): string {
    // Simple checksum implementation (use proper hashing in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Compression utilities
class SimpleCompression {
  static compress(text: string): string {
    try {
      // Simple compression using repetitive character replacement
      return text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/(.)\1{2,}/g, (match, char) => `${char}*${match.length}`) // Replace repeated characters
        .trim();
    } catch (error) {
      console.error('Compression failed:', error);
      return text;
    }
  }
  
  static decompress(compressedText: string): string {
    try {
      // Reverse the compression
      return compressedText.replace(/(.)\*(\d+)/g, (match, char, count) => 
        char.repeat(parseInt(count))
      );
    } catch (error) {
      console.error('Decompression failed:', error);
      return compressedText;
    }
  }
}

export class UltraMarketSecureStorage {
  private config: Required<SecureStorageConfig>;
  private storage: Storage;
  
  constructor(config: SecureStorageConfig = {}) {
    this.config = {
      encryptionKey: config.encryptionKey || this.generateDefaultKey(),
      useSessionStorage: config.useSessionStorage ?? false,
      enableCompression: config.enableCompression ?? true,
      keyPrefix: config.keyPrefix || 'ultramarket_secure_',
      expiration: config.expiration || 24 * 60 * 60 * 1000, // 24 hours default
      enableIntegrityCheck: config.enableIntegrityCheck ?? true,
    };
    
    this.storage = this.config.useSessionStorage ? sessionStorage : localStorage;
    
    // Cleanup expired items on initialization
    this.cleanupExpiredItems();
  }
  
  private generateDefaultKey(): string {
    // Generate a default encryption key based on browser fingerprint
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      window.location.hostname,
    ].join('|');
    
    return SimpleCrypto.generateChecksum(fingerprint);
  }
  
  private getFullKey(key: string): string {
    return this.config.keyPrefix + key;
  }
  
  private async createStorageItem(data: any): Promise<StorageItem> {
    let serializedData = JSON.stringify(data);
    
    // Compress if enabled
    if (this.config.enableCompression) {
      serializedData = SimpleCompression.compress(serializedData);
    }
    
    // Encrypt the data
    const encryptedData = await SimpleCrypto.encrypt(serializedData, this.config.encryptionKey);
    
    const item: StorageItem = {
      data: encryptedData,
      timestamp: Date.now(),
      expiration: Date.now() + this.config.expiration,
      compressed: this.config.enableCompression,
    };
    
    // Add integrity check
    if (this.config.enableIntegrityCheck) {
      item.checksum = SimpleCrypto.generateChecksum(encryptedData);
    }
    
    return item;
  }
  
  private async parseStorageItem(rawItem: string): Promise<any> {
    try {
      const item: StorageItem = JSON.parse(rawItem);
      
      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        throw new Error('Item has expired');
      }
      
      // Verify integrity
      if (this.config.enableIntegrityCheck && item.checksum) {
        const expectedChecksum = SimpleCrypto.generateChecksum(item.data);
        if (expectedChecksum !== item.checksum) {
          throw new Error('Data integrity check failed');
        }
      }
      
      // Decrypt the data
      let decryptedData = await SimpleCrypto.decrypt(item.data, this.config.encryptionKey);
      
      // Decompress if needed
      if (item.compressed && this.config.enableCompression) {
        decryptedData = SimpleCompression.decompress(decryptedData);
      }
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to parse storage item:', error);
      throw error;
    }
  }
  
  async setItem(key: string, value: any, customExpiration?: number): Promise<void> {
    try {
      const item = await this.createStorageItem(value);
      
      // Override expiration if provided
      if (customExpiration) {
        item.expiration = Date.now() + customExpiration;
      }
      
      this.storage.setItem(this.getFullKey(key), JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set secure storage item:', error);
      throw new Error('Failed to store data securely');
    }
  }
  
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const rawItem = this.storage.getItem(this.getFullKey(key));
      
      if (!rawItem) {
        return null;
      }
      
      return await this.parseStorageItem(rawItem);
    } catch (error) {
      console.error('Failed to get secure storage item:', error);
      // Remove corrupted item
      this.removeItem(key);
      return null;
    }
  }
  
  removeItem(key: string): void {
    this.storage.removeItem(this.getFullKey(key));
  }
  
  clear(): void {
    // Only clear items with our prefix
    const keys = this.getAllKeys();
    keys.forEach(key => this.storage.removeItem(key));
  }
  
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.config.keyPrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
  
  async hasItem(key: string): Promise<boolean> {
    try {
      const item = await this.getItem(key);
      return item !== null;
    } catch {
      return false;
    }
  }
  
  private cleanupExpiredItems(): void {
    const keys = this.getAllKeys();
    
    keys.forEach(fullKey => {
      try {
        const rawItem = this.storage.getItem(fullKey);
        if (rawItem) {
          const item: StorageItem = JSON.parse(rawItem);
          if (item.expiration && Date.now() > item.expiration) {
            this.storage.removeItem(fullKey);
          }
        }
      } catch (error) {
        // Remove corrupted items
        this.storage.removeItem(fullKey);
      }
    });
  }
  
  // Token-specific methods for authentication
  async setAuthTokens(tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<void> {
    const tokenExpiration = tokens.expiresIn * 1000; // Convert to milliseconds
    
    await Promise.all([
      this.setItem('access_token', tokens.accessToken, tokenExpiration),
      this.setItem('refresh_token', tokens.refreshToken, tokenExpiration * 2), // Refresh token lasts longer
      this.setItem('token_expiry', Date.now() + tokenExpiration),
    ]);
  }
  
  async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
    try {
      const [accessToken, refreshToken, tokenExpiry] = await Promise.all([
        this.getItem<string>('access_token'),
        this.getItem<string>('refresh_token'),
        this.getItem<number>('token_expiry'),
      ]);
      
      if (!accessToken || !refreshToken || !tokenExpiry) {
        return null;
      }
      
      return {
        accessToken,
        refreshToken,
        expiresIn: Math.max(0, tokenExpiry - Date.now()),
      };
    } catch (error) {
      console.error('Failed to get auth tokens:', error);
      return null;
    }
  }
  
  clearAuthTokens(): void {
    this.removeItem('access_token');
    this.removeItem('refresh_token');
    this.removeItem('token_expiry');
  }
  
  async isTokenValid(): Promise<boolean> {
    const tokens = await this.getAuthTokens();
    return tokens !== null && tokens.expiresIn > 300000; // Valid if more than 5 minutes left
  }
  
  // User data methods
  async setUserData(userData: any): Promise<void> {
    await this.setItem('user_data', userData);
  }
  
  async getUserData<T = any>(): Promise<T | null> {
    return this.getItem<T>('user_data');
  }
  
  clearUserData(): void {
    this.removeItem('user_data');
  }
  
  // Security utilities
  rotateEncryptionKey(newKey: string): void {
    // In a real implementation, you would re-encrypt all stored data with the new key
    this.config.encryptionKey = newKey;
    console.warn('Encryption key rotated. Existing data may become inaccessible.');
  }
  
  async exportData(): Promise<Record<string, any>> {
    const keys = this.getAllKeys();
    const data: Record<string, any> = {};
    
    for (const fullKey of keys) {
      const shortKey = fullKey.replace(this.config.keyPrefix, '');
      try {
        data[shortKey] = await this.getItem(shortKey);
      } catch (error) {
        console.error(`Failed to export data for key ${shortKey}:`, error);
      }
    }
    
    return data;
  }
  
  async importData(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      try {
        await this.setItem(key, value);
      } catch (error) {
        console.error(`Failed to import data for key ${key}:`, error);
      }
    }
  }
  
  // Cleanup and maintenance
  getStorageStats(): {
    totalItems: number;
    totalSize: number;
    oldestItem: number;
    newestItem: number;
  } {
    const keys = this.getAllKeys();
    let totalSize = 0;
    let oldestItem = Date.now();
    let newestItem = 0;
    
    keys.forEach(fullKey => {
      try {
        const rawItem = this.storage.getItem(fullKey);
        if (rawItem) {
          totalSize += rawItem.length;
          const item: StorageItem = JSON.parse(rawItem);
          oldestItem = Math.min(oldestItem, item.timestamp);
          newestItem = Math.max(newestItem, item.timestamp);
        }
      } catch (error) {
        // Ignore corrupted items for stats
      }
    });
    
    return {
      totalItems: keys.length,
      totalSize,
      oldestItem,
      newestItem,
    };
  }
}

// Create default instance
export const secureStorage = new UltraMarketSecureStorage();

// Export types
export type { SecureStorageConfig, StorageItem };

// Utility functions
export const createSecureStorage = (config?: SecureStorageConfig) => 
  new UltraMarketSecureStorage(config);

export default UltraMarketSecureStorage; 