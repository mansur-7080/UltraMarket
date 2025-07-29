/**
 * UltraMarket E-Commerce Platform
 * ProductCard Component - TypeScript React
 * Professional Product Display Card
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, ShoppingCartIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Product } from '../../services/types';
import { PriceDisplay, CompactPrice } from '../common/PriceDisplay';
import { cn } from '../../utils/ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { cartActions } from '../../store/slices/cartSlice';
import { wishlistActions } from '../../store/slices/wishlistSlice';

interface ProductCardProps {
  /** Product data */
  product: Product;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Card layout variant */
  variant?: 'grid' | 'list' | 'compact';
  /** Show quick actions */
  showQuickActions?: boolean;
  /** Show add to cart button */
  showAddToCart?: boolean;
  /** Show wishlist button */
  showWishlist?: boolean;
  /** Show product rating */
  showRating?: boolean;
  /** Show product brand */
  showBrand?: boolean;
  /** Show stock status */
  showStock?: boolean;
  /** Custom className */
  className?: string;
  /** Click handler for custom actions */
  onClick?: (product: Product) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disable interactions */
  disabled?: boolean;
}

const SIZE_CONFIGS = {
  sm: {
    container: 'w-full max-w-xs',
    image: 'h-32',
    title: 'text-sm',
    price: 'sm' as const,
    padding: 'p-3',
  },
  md: {
    container: 'w-full max-w-sm',
    image: 'h-48',
    title: 'text-base',
    price: 'md' as const,
    padding: 'p-4',
  },
  lg: {
    container: 'w-full max-w-md',
    image: 'h-64',
    title: 'text-lg',
    price: 'lg' as const,
    padding: 'p-6',
  },
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  size = 'md',
  variant = 'grid',
  showQuickActions = true,
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  showBrand = true,
  showStock = true,
  className,
  onClick,
  isLoading = false,
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { items: cartItems } = useAppSelector(state => state.cart);
  const { items: wishlistItems } = useAppSelector(state => state.wishlist);
  
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sizeConfig = SIZE_CONFIGS[size];
  
  // Check if product is in cart/wishlist
  const isInCart = cartItems.some(item => item.productId === product.id);
  const isInWishlist = wishlistItems.some(item => item.productId === product.id);
  
  // Product image with fallback
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || '/images/product-placeholder.jpg';
  
  // Handle add to cart
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !product.inventory.quantity) return;
    
    dispatch(cartActions.addItem({
      productId: product.id,
      product,
      quantity: 1,
      price: product.price,
    }));
  }, [dispatch, product, disabled]);

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (isInWishlist) {
      dispatch(wishlistActions.removeItem(product.id));
    } else {
      dispatch(wishlistActions.addItem({
        productId: product.id,
        product,
      }));
    }
  }, [dispatch, product, isInWishlist, disabled]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(product);
    }
  }, [onClick, product]);

  // Render rating stars
  const renderRating = () => {
    const rating = product.rating?.average || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarSolidIcon
              key={i}
              className={cn(
                'w-4 h-4',
                i < fullStars
                  ? 'text-yellow-400'
                  : i === fullStars && hasHalfStar
                  ? 'text-yellow-400'
                  : 'text-gray-200'
              )}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">
          ({product.rating?.count || 0})
        </span>
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn(sizeConfig.container, 'animate-pulse', className)}>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className={cn('bg-gray-200', sizeConfig.image)}></div>
          <div className={sizeConfig.padding}>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow',
          'flex items-center p-4 gap-4',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageError(true)}
          />
          {product.inventory.quantity === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-medium">Tugadi</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="font-medium text-gray-900 truncate hover:text-blue-600">
              {product.name}
            </h3>
          </Link>
          
          {showBrand && product.brand && (
            <p className="text-sm text-gray-500 mt-1">{product.brand.name}</p>
          )}
          
          {showRating && (
            <div className="mt-2">
              {renderRating()}
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center gap-4">
          <CompactPrice
            price={product.price}
            originalPrice={product.comparePrice}
            currency="USD"
          />
          
          {showQuickActions && (
            <div className="flex items-center gap-2">
              {showWishlist && (
                <button
                  onClick={handleWishlistToggle}
                  className={cn(
                    'p-2 rounded-full hover:bg-gray-100 transition-colors',
                    isInWishlist && 'text-red-500'
                  )}
                  disabled={disabled}
                >
                  {isInWishlist ? (
                    <HeartSolidIcon className="w-5 h-5" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                </button>
              )}
              
              {showAddToCart && (
                <button
                  onClick={handleAddToCart}
                  disabled={disabled || product.inventory.quantity === 0}
                  className={cn(
                    'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
                    'disabled:bg-gray-300 disabled:cursor-not-allowed',
                    isInCart && 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {isInCart ? 'Savatda' : 'Savatga'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div
      className={cn(
        sizeConfig.container,
        'bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-200',
        'group cursor-pointer overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={cn('relative overflow-hidden', sizeConfig.image)}>
        <img
          src={imageUrl}
          alt={product.name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            'group-hover:scale-105'
          )}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageError(true)}
        />
        
        {/* Image Loading */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Stock Overlay */}
        {product.inventory.quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">Tugadi</span>
          </div>
        )}

        {/* Discount Badge */}
        {product.comparePrice && product.comparePrice > product.price && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
            </span>
          </div>
        )}

        {/* Quick Actions */}
        {showQuickActions && (
          <div className={cn(
            'absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            {showWishlist && (
              <button
                onClick={handleWishlistToggle}
                className={cn(
                  'p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors',
                  isInWishlist && 'text-red-500'
                )}
                disabled={disabled}
              >
                {isInWishlist ? (
                  <HeartSolidIcon className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
            )}
            
            <Link
              to={`/products/${product.id}`}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={sizeConfig.padding}>
        {/* Brand */}
        {showBrand && product.brand && (
          <p className="text-sm text-gray-500 mb-1">{product.brand.name}</p>
        )}

        {/* Title */}
        <Link to={`/products/${product.id}`}>
          <h3 className={cn(
            sizeConfig.title,
            'font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors'
          )}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {showRating && (
          <div className="mb-3">
            {renderRating()}
          </div>
        )}

        {/* Price */}
        <div className="mb-4">
          <PriceDisplay
            price={product.price}
            originalPrice={product.comparePrice}
            size={sizeConfig.price}
            showDiscount={true}
            currency="USD"
          />
        </div>

        {/* Stock Status */}
        {showStock && (
          <div className="mb-4">
            {product.inventory.quantity > 0 ? (
              <span className="text-sm text-green-600">
                ✓ Mavjud ({product.inventory.quantity} dona)
              </span>
            ) : (
              <span className="text-sm text-red-600">✗ Tugagan</span>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={disabled || product.inventory.quantity === 0}
            className={cn(
              'w-full py-2 px-4 rounded-md font-medium transition-colors',
              isInCart
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700',
              'disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500'
            )}
          >
            {product.inventory.quantity === 0
              ? 'Tugagan'
              : isInCart
              ? 'Savatda ✓'
              : 'Savatga qo\'shish'
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
