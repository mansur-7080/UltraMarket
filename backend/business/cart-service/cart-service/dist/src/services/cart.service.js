"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class CartService {
    redisClient = (0, redis_1.getRedisClient)();
    CACHE_TTL = 3600;
    getCacheKey(userId) {
        return `cart:${userId}`;
    }
    async getCart(userId) {
        try {
            const cached = await this.redisClient.get(this.getCacheKey(userId));
            if (cached) {
                return JSON.parse(cached);
            }
            const cart = {
                userId,
                items: [],
                summary: {
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                },
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };
            await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error getting cart:', error);
            throw error;
        }
    }
    async addItem(userId, item) {
        try {
            const cart = await this.getCart(userId);
            const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.productId === item.productId);
            if (existingItemIndex >= 0 && cart.items[existingItemIndex]) {
                cart.items[existingItemIndex].quantity += item.quantity;
                if (typeof cart.items[existingItemIndex].subtotal !== 'undefined') {
                    cart.items[existingItemIndex].subtotal =
                        cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
                }
            }
            else {
                const newItem = {
                    ...item,
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    subtotal: item.price * item.quantity,
                };
                cart.items.push(newItem);
            }
            this.updateCartSummary(cart);
            await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));
            logger_1.logger.info(`Item added to cart for user ${userId}: ${item.productId}`);
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error adding item to cart:', error);
            throw error;
        }
    }
    updateCartSummary(cart) {
        if (!cart.summary) {
            cart.summary = {
                itemCount: 0,
                subtotal: 0,
                tax: 0,
                shipping: 0,
                discount: 0,
                total: 0,
            };
        }
        cart.summary.itemCount = cart.items.length;
        cart.summary.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cart.summary.tax = cart.summary.subtotal * 0.08;
        cart.summary.total =
            cart.summary.subtotal + cart.summary.tax + cart.summary.shipping - cart.summary.discount;
        cart.updatedAt = new Date().toISOString();
    }
    async updateItem(userId, productId, options) {
        return this.updateItemQuantity(userId, productId, options.quantity);
    }
    async updateItemQuantity(userId, productId, quantity) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw new Error('Cart not found');
            }
            const itemIndex = cart.items.findIndex((item) => item.productId === productId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
            else {
                const cartItem = cart.items[itemIndex];
                if (cartItem) {
                    cartItem.quantity = quantity;
                    if (typeof cartItem.subtotal !== 'undefined') {
                        cartItem.subtotal = cartItem.price * quantity;
                    }
                }
            }
            this.updateCartSummary(cart);
            await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));
            logger_1.logger.info(`Cart item quantity updated for user ${userId}: ${productId} -> ${quantity}`);
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error updating item quantity:', error);
            throw error;
        }
    }
    async removeItem(userId, productId) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw new Error('Cart not found');
            }
            const itemIndex = cart.items.findIndex((item) => item.productId === productId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }
            cart.items.splice(itemIndex, 1);
            this.updateCartSummary(cart);
            await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));
            logger_1.logger.info(`Item removed from cart for user ${userId}: ${productId}`);
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error removing item from cart:', error);
            throw error;
        }
    }
    async clearCart(userId) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw new Error('Cart not found');
            }
            cart.items = [];
            this.updateCartSummary(cart);
            await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));
            logger_1.logger.info(`Cart cleared for user ${userId}`);
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error clearing cart:', error);
            throw error;
        }
    }
    async invalidateCache(userId) {
        try {
            await this.redisClient.del(this.getCacheKey(userId));
            logger_1.logger.info(`Cache invalidated for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error invalidating cache:', error);
        }
    }
    async applyCoupon(userId, couponCode, couponData) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw new Error('Cart not found');
            }
            if (!couponData) {
                throw new Error('Invalid coupon code');
            }
            if (couponData.minimumPurchase &&
                cart.summary &&
                cart.summary.subtotal < couponData.minimumPurchase) {
                throw new Error(`Minimum purchase amount of ${couponData.minimumPurchase} required for this coupon`);
            }
            let discount = 0;
            if (couponData.type === 'percentage' && couponData.value) {
                discount = (cart.summary?.subtotal ?? 0) * (couponData.value / 100);
            }
            else if (couponData.type === 'fixed' && couponData.value) {
                discount = couponData.value;
            }
            if (couponData.maxDiscount && discount > couponData.maxDiscount) {
                discount = couponData.maxDiscount;
            }
            if (cart.summary) {
                cart.summary.discount = discount;
                cart.summary.total =
                    (cart.summary.subtotal || 0) +
                        (cart.summary.tax || 0) +
                        (cart.summary.shipping || 0) -
                        discount;
            }
            cart.coupon = {
                code: couponCode,
                discount,
            };
            if (!cart.appliedCoupons) {
                cart.appliedCoupons = [];
            }
            cart.appliedCoupons.push({
                code: couponCode,
                discount,
            });
            await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));
            logger_1.logger.info(`Coupon ${couponCode} applied to cart for user ${userId}`);
            return cart;
        }
        catch (error) {
            logger_1.logger.error('Error applying coupon:', error);
            throw error;
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=cart.service.js.map