import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
interface Translation {
    id: string;
    key: string;
    language: string;
    value: string;
    context?: string;
    pluralForm?: string;
    metadata?: {
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        approved: boolean;
        version: number;
    };
}
interface LanguageConfig {
    code: string;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
    region: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
    numberFormat: {
        decimal: string;
        thousands: string;
        precision: number;
    };
    pluralRules: string[];
    fallback: string;
    enabled: boolean;
}
interface TranslationRequest {
    key: string;
    language: string;
    context?: string;
    pluralCount?: number;
    interpolations?: Record<string, any>;
}
interface TranslationResponse {
    key: string;
    language: string;
    value: string;
    interpolated: string;
    cached: boolean;
    fallback: boolean;
}
interface BulkTranslationRequest {
    keys: string[];
    language: string;
    context?: string;
    interpolations?: Record<string, Record<string, any>>;
}
interface TranslationStats {
    totalKeys: number;
    translatedKeys: number;
    completionPercentage: number;
    missingKeys: string[];
    lastUpdated: Date;
}
export declare class MultiLanguageService {
    private translationRepository;
    private redis;
    private readonly logger;
    private readonly supportedLanguages;
    private readonly translationCache;
    private readonly defaultLanguage;
    constructor(translationRepository: Repository<Translation>, redis: Redis);
    /**
     * Get translation for a key
     */
    getTranslation(request: TranslationRequest): Promise<TranslationResponse>;
    /**
     * Get multiple translations at once
     */
    getBulkTranslations(request: BulkTranslationRequest): Promise<TranslationResponse[]>;
    /**
     * Add or update translation
     */
    setTranslation(translation: Partial<Translation>): Promise<Translation>;
    /**
     * Import translations from JSON file
     */
    importTranslations(filePath: string, language: string, context?: string): Promise<{
        imported: number;
        errors: string[];
    }>;
    /**
     * Export translations to JSON file
     */
    exportTranslations(language: string, context?: string): Promise<Record<string, string>>;
    /**
     * Get translation statistics
     */
    getTranslationStats(language: string): Promise<TranslationStats>;
    /**
     * Get supported languages
     */
    getSupportedLanguages(): LanguageConfig[];
    /**
     * Get language configuration
     */
    getLanguageConfig(language: string): LanguageConfig | undefined;
    /**
     * Format number according to language settings
     */
    formatNumber(value: number, language: string): string;
    /**
     * Format currency according to language settings
     */
    formatCurrency(value: number, language: string): string;
    /**
     * Format date according to language settings
     */
    formatDate(date: Date, language: string): string;
    /**
     * Format time according to language settings
     */
    formatTime(date: Date, language: string): string;
    /**
     * Auto-translate using external service (placeholder)
     */
    autoTranslate(text: string, fromLanguage: string, toLanguage: string): Promise<string>;
    /**
     * Validate translation completeness
     */
    validateTranslations(language: string): Promise<{
        isComplete: boolean;
        missingKeys: string[];
        invalidTranslations: string[];
    }>;
    /**
     * Clear translation cache
     */
    clearCache(language?: string, key?: string): Promise<void>;
    private initializeLanguages;
    private loadTranslations;
    private getTranslationFromDatabase;
    private buildCacheKey;
    private interpolateString;
    private handlePluralization;
}
export {};
//# sourceMappingURL=multi-language.service.d.ts.map