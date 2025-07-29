"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = exports.CartService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const shared_1 = require("@ultramarket/shared");
class CartService {
    redis;
    defaultTTL = 7 * 24 * 60 * 60;
    constructor() {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.redis.on('error', (error) => {
            shared_1.logger.error('Redis connection error:', error);
        });
        this.redis.on('connect', () => {
            shared_1.logger.info('Redis connected successfully');
        });
    }
    async getCart(userId) {
        try {
            const cartKey = this.getCartKey(userId);
            const cartData = await this.redis.get(cartKey);
            if (!cartData) {
                return null;
            }
            const cart = JSON.parse(cartData);
            cart.createdAt = new Date(cart.createdAt);
            cart.updatedAt = new Date(cart.updatedAt);
            cart.expiresAt = cart.expiresAt ? new Date(cart.expiresAt) : undefined;
            cart.items.forEach((item) => {
                item.addedAt = new Date(item.addedAt);
                item.updatedAt = new Date(item.updatedAt);
            });
            return cart;
        }
        catch (error) {
            shared_1.logger.error('Failed to get cart:', error);
            throw (0, shared_1.createError)(500, 'Failed to retrieve cart');
        }
    }
    async saveCart(cart) {
        try {
            const cartKey = this.getCartKey(cart.userId);
            cart.updatedAt = new Date();
            await this.redis.setex(cartKey, this.defaultTTL, JSON.stringify(cart));
            shared_1.logger.debug('Cart saved successfully', { userId: cart.userId });
        }
        catch (error) {
            shared_1.logger.error('Failed to save cart:', error);
            throw (0, shared_1.createError)(500, 'Failed to save cart');
        }
    }
    async addItem(userId, item) {
        try {
            let cart = await this.getCart(userId);
            if (!cart) {
                cart = this.createEmptyCart(userId);
            }
            const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.productId === item.productId &&
                JSON.stringify(cartItem.attributes || {}) === JSON.stringify(item.attributes || {}));
            const now = new Date();
            if (existingItemIndex >= 0) {
                cart.items[existingItemIndex].quantity += item.quantity;
                cart.items[existingItemIndex].updatedAt = now;
            }
            else {
                cart.items.push({
                    ...item,
                    addedAt: now,
                    updatedAt: now,
                });
            }
            cart = this.recalculateCart(cart);
            await this.saveCart(cart);
            this.emitCartEvent('cart.item.added', userId, {
                productId: item.productId,
                quantity: item.quantity,
            });
            return cart;
        }
        catch (error) {
            shared_1.logger.error('Failed to add item to cart:', error);
            throw error;
        }
    }
    async updateItemQuantity(userId, productId, quantity, attributes) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw (0, shared_1.createError)(404, 'Cart not found');
            }
            const itemIndex = cart.items.findIndex((item) => item.productId === productId &&
                JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}));
            if (itemIndex === -1) {
                throw (0, shared_1.createError)(404, 'Item not found in cart');
            }
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
            else {
                cart.items[itemIndex].quantity = quantity;
                cart.items[itemIndex].updatedAt = new Date();
            }
            const updatedCart = this.recalculateCart(cart);
            await this.saveCart(updatedCart);
            this.emitCartEvent('cart.item.updated', userId, {
                productId,
                quantity,
            });
            return updatedCart;
        }
        catch (error) {
            shared_1.logger.error('Failed to update item quantity:', error);
            throw error;
        }
    }
    async removeItem(userId, productId, attributes) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw (0, shared_1.createError)(404, 'Cart not found');
            }
            const initialLength = cart.items.length;
            cart.items = cart.items.filter((item) => !(item.productId === productId &&
                JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})));
            if (cart.items.length === initialLength) {
                throw (0, shared_1.createError)(404, 'Item not found in cart');
            }
            const updatedCart = this.recalculateCart(cart);
            await this.saveCart(updatedCart);
            this.emitCartEvent('cart.item.removed', userId, {
                productId,
            });
            return updatedCart;
        }
        catch (error) {
            shared_1.logger.error('Failed to remove item from cart:', error);
            throw error;
        }
    }
    async clearCart(userId) {
        try {
            const cartKey = this.getCartKey(userId);
            await this.redis.del(cartKey);
            this.emitCartEvent('cart.cleared', userId, {});
            shared_1.logger.debug('Cart cleared successfully', { userId });
        }
        catch (error) {
            shared_1.logger.error('Failed to clear cart:', error);
            throw (0, shared_1.createError)(500, 'Failed to clear cart');
        }
    }
    async getCartSummary(userId) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                return null;
            }
            return {
                totalItems: cart.totalItems,
                subtotal: cart.subtotal,
                estimatedShipping: cart.estimatedShipping,
                estimatedTax: cart.estimatedTax,
                estimatedTotal: cart.estimatedTotal,
                currency: cart.currency,
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to get cart summary:', error);
            throw (0, shared_1.createError)(500, 'Failed to get cart summary');
        }
    }
    async mergeGuestCart(userId, guestCartItems) {
        try {
            let userCart = await this.getCart(userId);
            if (!userCart) {
                userCart = this.createEmptyCart(userId);
            }
            for (const guestItem of guestCartItems) {
                const existingItemIndex = userCart.items.findIndex((item) => item.productId === guestItem.productId &&
                    JSON.stringify(item.attributes || {}) === JSON.stringify(guestItem.attributes || {}));
                if (existingItemIndex >= 0) {
                    userCart.items[existingItemIndex].quantity += guestItem.quantity;
                    userCart.items[existingItemIndex].updatedAt = new Date();
                }
                else {
                    userCart.items.push({
                        ...guestItem,
                        addedAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
            const mergedCart = this.recalculateCart(userCart);
            await this.saveCart(mergedCart);
            this.emitCartEvent('cart.merged', userId, {
                guestItemsCount: guestCartItems.length,
            });
            return mergedCart;
        }
        catch (error) {
            shared_1.logger.error('Failed to merge guest cart:', error);
            throw error;
        }
    }
    async validateCart(userId) {
        try {
            const cart = await this.getCart(userId);
            if (!cart || cart.items.length === 0) {
                return { isValid: true, issues: [] };
            }
            const issues = [];
            for (const item of cart.items) {
                if (item.quantity <= 0) {
                    issues.push(`Invalid quantity for ${item.productName}`);
                }
                if (item.price <= 0) {
                    issues.push(`Invalid price for ${item.productName}`);
                }
            }
            return {
                isValid: issues.length === 0,
                issues,
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to validate cart:', error);
            throw (0, shared_1.createError)(500, 'Failed to validate cart');
        }
    }
    async applyCoupon(userId, couponCode) {
        try {
            const cart = await this.getCart(userId);
            if (!cart) {
                throw (0, shared_1.createError)(404, 'Cart not found');
            }
            const discount = cart.subtotal * 0.1;
            cart.appliedCoupon = {
                code: couponCode,
                discount,
                appliedAt: new Date(),
            };
            const updatedCart = this.recalculateCart(cart, discount);
            await this.saveCart(updatedCart);
            this.emitCartEvent('cart.coupon.applied', userId, {
                couponCode,
                discount,
            });
            return updatedCart;
        }
        catch (error) {
            shared_1.logger.error('Failed to apply coupon:', error);
            throw error;
        }
    }
    getCartKey(userId) {
        return `cart:${userId}`;
    }
    createEmptyCart(userId) {
        const now = new Date();
        return {
            userId,
            items: [],
            totalItems: 0,
            subtotal: 0,
            estimatedShipping: 0,
            estimatedTax: 0,
            estimatedTotal: 0,
            currency: 'USD',
            createdAt: now,
            updatedAt: now,
            expiresAt: new Date(now.getTime() + this.defaultTTL * 1000),
        };
    }
    recalculateCart(cart, discount = 0) {
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.estimatedShipping = cart.subtotal > 50 ? 0 : 9.99;
        cart.estimatedTax = cart.subtotal * 0.085;
        cart.estimatedTotal = cart.subtotal + cart.estimatedShipping + cart.estimatedTax - discount;
        cart.updatedAt = new Date();
        return cart;
    }
    emitCartEvent(event, userId, data) {
        shared_1.logger.info('Cart event emitted', { event, userId, data });
    }
    async healthCheck() {
        try {
            await this.redis.ping();
            return true;
        }
        catch (error) {
            shared_1.logger.error('Cart service health check failed:', error);
            return false;
        }
    }
    async cleanupExpiredCarts() {
        try {
            const pattern = 'cart:*';
            const keys = await this.redis.keys(pattern);
            let cleanedCount = 0;
            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl <= 0) {
                    await this.redis.del(key);
                    cleanedCount++;
                }
            }
            shared_1.logger.info('Expired carts cleaned up', { count: cleanedCount });
            return cleanedCount;
        }
        catch (error) {
            shared_1.logger.error('Failed to cleanup expired carts:', error);
            return 0;
        }
    }
}
exports.CartService = CartService;
exports.cartService = new CartService();
//# sourceMappingURL=Cart.js.map