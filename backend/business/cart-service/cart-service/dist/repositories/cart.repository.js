"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCartRepository = exports.PrismaCartRepository = void 0;
const logger_1 = require("../utils/logger");
class PrismaCartRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        try {
            return await this.prisma.cart.findUnique({
                where: { userId },
            });
        }
        catch (error) {
            logger_1.logger.error('Error finding cart by userId:', error);
            throw error;
        }
    }
    async create(userId) {
        try {
            return await this.prisma.cart.create({
                data: {
                    userId,
                    totalAmount: 0,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating cart:', error);
            throw error;
        }
    }
    async addItem(cartId, item) {
        try {
            const { productId, quantity, price } = item;
            return await this.prisma.cartItem.create({
                data: {
                    cartId,
                    productId,
                    quantity,
                    price,
                    name: item.name || 'Product',
                    sku: item.sku || `SKU-${productId}`,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error adding item to cart:', error);
            throw error;
        }
    }
    async updateItemQuantity(cartItemId, quantity) {
        try {
            return await this.prisma.cartItem.update({
                where: { id: cartItemId },
                data: { quantity },
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating cart item quantity:', error);
            throw error;
        }
    }
    async removeItem(cartItemId) {
        try {
            await this.prisma.cartItem.delete({
                where: { id: cartItemId },
            });
        }
        catch (error) {
            logger_1.logger.error('Error removing cart item:', error);
            throw error;
        }
    }
    async clearCart(cartId) {
        try {
            await this.prisma.cartItem.deleteMany({
                where: { cartId },
            });
        }
        catch (error) {
            logger_1.logger.error('Error clearing cart:', error);
            throw error;
        }
    }
    async getCartWithItems(userId) {
        try {
            return await this.prisma.cart.findUnique({
                where: { userId },
                include: { items: true },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting cart with items:', error);
            throw error;
        }
    }
}
exports.PrismaCartRepository = PrismaCartRepository;
const createCartRepository = (prisma) => {
    return new PrismaCartRepository(prisma);
};
exports.createCartRepository = createCartRepository;
exports.default = exports.createCartRepository;
//# sourceMappingURL=cart.repository.js.map