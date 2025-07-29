import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Interfaces
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

@Injectable()
export class MultiLanguageService {
  private readonly logger = new Logger(MultiLanguageService.name);
  private readonly supportedLanguages: Map<string, LanguageConfig> = new Map();
  private readonly translationCache: Map<string, Translation> = new Map();
  private readonly defaultLanguage = 'uz';

  constructor(
    @InjectRepository('Translation') private translationRepository: Repository<Translation>,
    @InjectRedis() private redis: Redis
  ) {
    this.initializeLanguages();
    this.loadTranslations();
  }

  /**
   * Get translation for a key
   */
  async getTranslation(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { key, language, context, pluralCount, interpolations } = request;

      // Check cache first
      const cacheKey = this.buildCacheKey(key, language, context);
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        const translation = JSON.parse(cached);
        const interpolated = this.interpolateString(translation.value, interpolations);

        return {
          key,
          language,
          value: translation.value,
          interpolated,
          cached: true,
          fallback: false,
        };
      }

      // Get from database
      let translation = await this.getTranslationFromDatabase(key, language, context);
      let fallback = false;

      // Try fallback language if not found
      if (!translation) {
        const languageConfig = this.supportedLanguages.get(language);
        const fallbackLanguage = languageConfig?.fallback || this.defaultLanguage;

        if (fallbackLanguage !== language) {
          translation = await this.getTranslationFromDatabase(key, fallbackLanguage, context);
          fallback = true;
        }
      }

      // Use key as fallback if no translation found
      if (!translation) {
        translation = {
          id: '',
          key,
          language,
          value: key,
          context,
        };
        fallback = true;
      }

      // Handle pluralization
      if (pluralCount !== undefined && translation.pluralForm) {
        translation.value = this.handlePluralization(
          translation.value,
          translation.pluralForm,
          pluralCount,
          language
        );
      }

      // Cache the result
      await this.redis.setex(cacheKey, 3600, JSON.stringify(translation));

      const interpolated = this.interpolateString(translation.value, interpolations);

      return {
        key,
        language,
        value: translation.value,
        interpolated,
        cached: false,
        fallback,
      };
    } catch (error) {
      this.logger.error('Error getting translation:', error);
      return {
        key: request.key,
        language: request.language,
        value: request.key,
        interpolated: request.key,
        cached: false,
        fallback: true,
      };
    }
  }

  /**
   * Get multiple translations at once
   */
  async getBulkTranslations(request: BulkTranslationRequest): Promise<TranslationResponse[]> {
    try {
      const { keys, language, context, interpolations } = request;

      const translations = await Promise.all(
        keys.map((key) =>
          this.getTranslation({
            key,
            language,
            context,
            interpolations: interpolations?.[key],
          })
        )
      );

      return translations;
    } catch (error) {
      this.logger.error('Error getting bulk translations:', error);
      return keys.map((key) => ({
        key,
        language: request.language,
        value: key,
        interpolated: key,
        cached: false,
        fallback: true,
      }));
    }
  }

  /**
   * Add or update translation
   */
  async setTranslation(translation: Partial<Translation>): Promise<Translation> {
    try {
      const { key, language, value, context, pluralForm } = translation;

      // Check if translation exists
      const existing = await this.translationRepository.findOne({
        where: { key, language, context },
      });

      let savedTranslation: Translation;

      if (existing) {
        // Update existing translation
        existing.value = value;
        existing.pluralForm = pluralForm;
        existing.metadata = {
          ...existing.metadata,
          updatedAt: new Date(),
          version: (existing.metadata?.version || 0) + 1,
        };

        savedTranslation = await this.translationRepository.save(existing);
      } else {
        // Create new translation
        const newTranslation = this.translationRepository.create({
          key,
          language,
          value,
          context,
          pluralForm,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            approved: false,
            version: 1,
          },
        });

        savedTranslation = await this.translationRepository.save(newTranslation);
      }

      // Clear cache
      const cacheKey = this.buildCacheKey(key, language, context);
      await this.redis.del(cacheKey);

      this.logger.log(`Translation updated: ${key} (${language})`);
      return savedTranslation;
    } catch (error) {
      this.logger.error('Error setting translation:', error);
      throw error;
    }
  }

  /**
   * Import translations from JSON file
   */
  async importTranslations(
    filePath: string,
    language: string,
    context?: string
  ): Promise<{ imported: number; errors: string[] }> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(fileContent);

      let imported = 0;
      const errors: string[] = [];

      for (const [key, value] of Object.entries(translations)) {
        try {
          await this.setTranslation({
            key,
            language,
            value: value as string,
            context,
          });
          imported++;
        } catch (error) {
          errors.push(`Error importing ${key}: ${error.message}`);
        }
      }

      this.logger.log(`Imported ${imported} translations for ${language}`);
      return { imported, errors };
    } catch (error) {
      this.logger.error('Error importing translations:', error);
      throw error;
    }
  }

  /**
   * Export translations to JSON file
   */
  async exportTranslations(language: string, context?: string): Promise<Record<string, string>> {
    try {
      const query = this.translationRepository
        .createQueryBuilder('translation')
        .where('translation.language = :language', { language });

      if (context) {
        query.andWhere('translation.context = :context', { context });
      }

      const translations = await query.getMany();

      const result: Record<string, string> = {};
      for (const translation of translations) {
        result[translation.key] = translation.value;
      }

      return result;
    } catch (error) {
      this.logger.error('Error exporting translations:', error);
      throw error;
    }
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats(language: string): Promise<TranslationStats> {
    try {
      // Get all unique keys
      const allKeys = await this.translationRepository
        .createQueryBuilder('translation')
        .select('DISTINCT translation.key', 'key')
        .getRawMany();

      const totalKeys = allKeys.length;

      // Get translated keys for the language
      const translatedKeys = await this.translationRepository
        .createQueryBuilder('translation')
        .select('translation.key', 'key')
        .where('translation.language = :language', { language })
        .getRawMany();

      const translatedCount = translatedKeys.length;
      const translatedKeySet = new Set(translatedKeys.map((t) => t.key));
      const missingKeys = allKeys.map((k) => k.key).filter((key) => !translatedKeySet.has(key));

      // Get last updated
      const lastUpdated = await this.translationRepository
        .createQueryBuilder('translation')
        .select('MAX(translation.metadata->>"$.updatedAt")', 'lastUpdated')
        .where('translation.language = :language', { language })
        .getRawOne();

      return {
        totalKeys,
        translatedKeys: translatedCount,
        completionPercentage: totalKeys > 0 ? (translatedCount / totalKeys) * 100 : 0,
        missingKeys,
        lastUpdated: lastUpdated?.lastUpdated ? new Date(lastUpdated.lastUpdated) : new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting translation stats:', error);
      throw error;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.supportedLanguages.values());
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(language: string): LanguageConfig | undefined {
    return this.supportedLanguages.get(language);
  }

  /**
   * Format number according to language settings
   */
  formatNumber(value: number, language: string): string {
    const config = this.supportedLanguages.get(language);
    if (!config) return value.toString();

    const { decimal, thousands, precision } = config.numberFormat;

    return value
      .toFixed(precision)
      .replace('.', decimal)
      .replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  }

  /**
   * Format currency according to language settings
   */
  formatCurrency(value: number, language: string): string {
    const config = this.supportedLanguages.get(language);
    if (!config) return value.toString();

    const formattedNumber = this.formatNumber(value, language);
    return `${formattedNumber} ${config.currency}`;
  }

  /**
   * Format date according to language settings
   */
  formatDate(date: Date, language: string): string {
    const config = this.supportedLanguages.get(language);
    if (!config) return date.toISOString();

    // Simple date formatting - in real implementation, use a proper date library
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return config.dateFormat.replace('DD', day).replace('MM', month).replace('YYYY', year);
  }

  /**
   * Format time according to language settings
   */
  formatTime(date: Date, language: string): string {
    const config = this.supportedLanguages.get(language);
    if (!config) return date.toTimeString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return config.timeFormat.replace('HH', hours).replace('MM', minutes);
  }

  /**
   * Auto-translate using external service (placeholder)
   */
  async autoTranslate(text: string, fromLanguage: string, toLanguage: string): Promise<string> {
    try {
      // This would integrate with a translation service like Google Translate
      // For now, return the original text
      this.logger.warn('Auto-translation not implemented');
      return text;
    } catch (error) {
      this.logger.error('Error auto-translating:', error);
      return text;
    }
  }

  /**
   * Validate translation completeness
   */
  async validateTranslations(language: string): Promise<{
    isComplete: boolean;
    missingKeys: string[];
    invalidTranslations: string[];
  }> {
    try {
      const stats = await this.getTranslationStats(language);
      const invalidTranslations: string[] = [];

      // Check for invalid translations (empty values, etc.)
      const translations = await this.translationRepository.find({
        where: { language },
      });

      for (const translation of translations) {
        if (!translation.value || translation.value.trim() === '') {
          invalidTranslations.push(translation.key);
        }
      }

      return {
        isComplete: stats.completionPercentage === 100,
        missingKeys: stats.missingKeys,
        invalidTranslations,
      };
    } catch (error) {
      this.logger.error('Error validating translations:', error);
      throw error;
    }
  }

  /**
   * Clear translation cache
   */
  async clearCache(language?: string, key?: string): Promise<void> {
    try {
      if (key && language) {
        const cacheKey = this.buildCacheKey(key, language);
        await this.redis.del(cacheKey);
      } else if (language) {
        const pattern = `translation:${language}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        const pattern = 'translation:*';
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      this.logger.log('Translation cache cleared');
    } catch (error) {
      this.logger.error('Error clearing translation cache:', error);
      throw error;
    }
  }

  // Private helper methods
  private initializeLanguages(): void {
    const languages: LanguageConfig[] = [
      {
        code: 'uz',
        name: 'Uzbek',
        nativeName: "O'zbek",
        direction: 'ltr',
        region: 'UZ',
        currency: 'UZS',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:MM',
        numberFormat: {
          decimal: ',',
          thousands: ' ',
          precision: 2,
        },
        pluralRules: ['one', 'other'],
        fallback: 'en',
        enabled: true,
      },
      {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        direction: 'ltr',
        region: 'RU',
        currency: 'RUB',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:MM',
        numberFormat: {
          decimal: ',',
          thousands: ' ',
          precision: 2,
        },
        pluralRules: ['one', 'few', 'many', 'other'],
        fallback: 'en',
        enabled: true,
      },
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        region: 'US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'HH:MM',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          precision: 2,
        },
        pluralRules: ['one', 'other'],
        fallback: 'uz',
        enabled: true,
      },
    ];

    for (const language of languages) {
      this.supportedLanguages.set(language.code, language);
    }

    this.logger.log(`Initialized ${languages.length} languages`);
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Load frequently used translations into memory cache
      const commonTranslations = await this.translationRepository
        .createQueryBuilder('translation')
        .where('translation.metadata->>"$.approved" = :approved', { approved: true })
        .limit(1000)
        .getMany();

      for (const translation of commonTranslations) {
        const cacheKey = this.buildCacheKey(
          translation.key,
          translation.language,
          translation.context
        );
        this.translationCache.set(cacheKey, translation);
      }

      this.logger.log(`Loaded ${commonTranslations.length} translations into cache`);
    } catch (error) {
      this.logger.error('Error loading translations:', error);
    }
  }

  private async getTranslationFromDatabase(
    key: string,
    language: string,
    context?: string
  ): Promise<Translation | null> {
    const query = this.translationRepository
      .createQueryBuilder('translation')
      .where('translation.key = :key', { key })
      .andWhere('translation.language = :language', { language });

    if (context) {
      query.andWhere('translation.context = :context', { context });
    } else {
      query.andWhere('translation.context IS NULL');
    }

    return await query.getOne();
  }

  private buildCacheKey(key: string, language: string, context?: string): string {
    return `translation:${language}:${context || 'default'}:${key}`;
  }

  private interpolateString(template: string, interpolations?: Record<string, any>): string {
    if (!interpolations) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return interpolations[key] !== undefined ? interpolations[key] : match;
    });
  }

  private handlePluralization(
    singular: string,
    plural: string,
    count: number,
    language: string
  ): string {
    const config = this.supportedLanguages.get(language);
    if (!config) return count === 1 ? singular : plural;

    // Simple pluralization logic - in real implementation, use a proper pluralization library
    switch (language) {
      case 'uz':
        return count === 1 ? singular : plural;
      case 'ru':
        if (count === 1) return singular;
        if (count >= 2 && count <= 4) return plural;
        return plural;
      case 'en':
        return count === 1 ? singular : plural;
      default:
        return count === 1 ? singular : plural;
    }
  }
}
