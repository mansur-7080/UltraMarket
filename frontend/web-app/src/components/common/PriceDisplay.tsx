/**
 * UltraMarket E-Commerce Platform
 * PriceDisplay Component - TypeScript React
 * Professional Price Formatting Component
 */

import React from 'react';
import { cn } from '../../utils/ui';

interface PriceDisplayProps {
  /** Current price */
  price: number;
  /** Original price for discount display */
  originalPrice?: number;
  /** Currency code (default: USD) */
  currency?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  /** Show currency symbol */
  showCurrency?: boolean;
  /** Show discount percentage */
  showDiscount?: boolean;
  /** Show free shipping indicator */
  showFreeShipping?: boolean;
  /** Custom className */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Uzbekistan specific formatting */
  uzbekFormat?: boolean;
}

interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  decimal: number;
  separator: string;
  thousand: string;
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { symbol: '$', position: 'before', decimal: 2, separator: '.', thousand: ',' },
  EUR: { symbol: '€', position: 'after', decimal: 2, separator: '.', thousand: ',' },
  UZS: { symbol: 'сўм', position: 'after', decimal: 0, separator: '.', thousand: ' ' },
  RUB: { symbol: '₽', position: 'after', decimal: 2, separator: '.', thousand: ' ' },
  GBP: { symbol: '£', position: 'before', decimal: 2, separator: '.', thousand: ',' },
};

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-xl font-bold',
};

const VARIANT_CLASSES = {
  default: 'text-gray-900',
  success: 'text-green-600',
  danger: 'text-red-600',
  warning: 'text-amber-600',
  muted: 'text-gray-500',
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  currency = 'USD',
  size = 'md',
  variant = 'default',
  showCurrency = true,
  showDiscount = true,
  showFreeShipping = false,
  className,
  isLoading = false,
  uzbekFormat = false,
}) => {
  const currencyConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;

  // Format number with thousand separators
  const formatNumber = (num: number): string => {
    const rounded = Math.round(num * Math.pow(10, currencyConfig.decimal)) / Math.pow(10, currencyConfig.decimal);
    
    if (uzbekFormat && currency === 'UZS') {
      // Uzbekistan specific formatting: no decimals, space separator
      return Math.round(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    
    const parts = rounded.toFixed(currencyConfig.decimal).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencyConfig.thousand);
    return parts.join(currencyConfig.separator);
  };

  // Format price with currency
  const formatPrice = (amount: number): string => {
    const formattedNumber = formatNumber(amount);
    
    if (!showCurrency) {
      return formattedNumber;
    }
    
    if (currencyConfig.position === 'before') {
      return `${currencyConfig.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${currencyConfig.symbol}`;
    }
  };

  // Calculate discount percentage
  const discountPercentage = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Current Price */}
      <span
        className={cn(
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          'font-medium'
        )}
      >
        {formatPrice(price)}
      </span>

      {/* Original Price (if discounted) */}
      {originalPrice && originalPrice > price && (
        <span
          className={cn(
            'line-through text-gray-400',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {formatPrice(originalPrice)}
        </span>
      )}

      {/* Discount Badge */}
      {showDiscount && discountPercentage > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          -{discountPercentage}%
        </span>
      )}

      {/* Free Shipping Badge */}
      {showFreeShipping && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Bepul yetkazib berish
        </span>
      )}
    </div>
  );
};

// Price range component for min-max prices
interface PriceRangeProps {
  minPrice: number;
  maxPrice: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  uzbekFormat?: boolean;
}

export const PriceRange: React.FC<PriceRangeProps> = ({
  minPrice,
  maxPrice,
  currency = 'USD',
  size = 'md',
  className,
  uzbekFormat = false,
}) => {
  if (minPrice === maxPrice) {
    return (
      <PriceDisplay
        price={minPrice}
        currency={currency}
        size={size}
        className={className}
        uzbekFormat={uzbekFormat}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <PriceDisplay
        price={minPrice}
        currency={currency}
        size={size}
        uzbekFormat={uzbekFormat}
      />
      <span className="text-gray-400">-</span>
      <PriceDisplay
        price={maxPrice}
        currency={currency}
        size={size}
        uzbekFormat={uzbekFormat}
      />
    </div>
  );
};

// Compact price display for lists
interface CompactPriceProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  showSymbol?: boolean;
  uzbekFormat?: boolean;
}

export const CompactPrice: React.FC<CompactPriceProps> = ({
  price,
  originalPrice,
  currency = 'USD',
  showSymbol = true,
  uzbekFormat = false,
}) => {
  const hasDiscount = originalPrice && originalPrice > price;
  
  return (
    <div className="flex items-center gap-1">
      <PriceDisplay
        price={price}
        currency={currency}
        size="sm"
        variant={hasDiscount ? 'danger' : 'default'}
        showCurrency={showSymbol}
        showDiscount={false}
        uzbekFormat={uzbekFormat}
      />
      {hasDiscount && (
        <span className="text-xs text-gray-400 line-through">
          <PriceDisplay
            price={originalPrice}
            currency={currency}
            size="sm"
            showCurrency={showSymbol}
            showDiscount={false}
            uzbekFormat={uzbekFormat}
          />
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;
