"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
const logger_1 = require("../utils/logger");
class CartController {
    cartService = new cart_service_1.CartService();
    async getCart(req, res) {
        try {
            const userId = req.headers['user-id'];
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const cart = await this.cartService.getCart(userId);
            res.json({
                success: true,
                data: cart,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getCart controller:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get cart',
            });
        }
    }
    async addItem(req, res) {
        try {
            const userId = req.headers['user-id'];
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const item = req.body;
            if (!item.productId || !item.productName || !item.price || !item.quantity) {
                res.status(400).json({
                    success: false,
                    message: 'productId, name, price, and quantity are required',
                });
                return;
            }
            const cart = await this.cartService.addItem(userId, item);
            res.status(201).json({
                success: true,
                data: cart,
                message: 'Item added to cart successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in addItem controller:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add item to cart',
            });
        }
    }
    async updateItemQuantity(req, res) {
        try {
            const userId = req.headers['user-id'];
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const { productId } = req.params;
            const { quantity } = req.body;
            if (!productId || typeof quantity !== 'number' || quantity < 0) {
                res.status(400).json({
                    success: false,
                    message: 'Valid productId and quantity are required',
                });
                return;
            }
            const cart = await this.cartService.updateItemQuantity(userId, productId, quantity);
            res.json({
                success: true,
                data: cart,
                message: 'Item quantity updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in updateItemQuantity controller:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update item quantity',
            });
        }
    }
    async removeItem(req, res) {
        try {
            const userId = req.headers['user-id'];
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const { productId } = req.params;
            if (!productId) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required',
                });
                return;
            }
            const cart = await this.cartService.removeItem(userId, productId);
            res.json({
                success: true,
                data: cart,
                message: 'Item removed from cart successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in removeItem controller:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart',
            });
        }
    }
    async clearCart(req, res) {
        try {
            const userId = req.headers['user-id'];
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const cart = await this.cartService.clearCart(userId);
            res.json({
                success: true,
                data: cart,
                message: 'Cart cleared successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in clearCart controller:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clear cart',
            });
        }
    }
}
exports.CartController = CartController;
//# sourceMappingURL=cart.controller.js.map