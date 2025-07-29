import { Request, Response } from 'express';
import { CartService, ICartItem } from '../services/cart.service';
import { logger } from '../utils/logger';

export class CartController {
  private cartService = new CartService();

  async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;
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
    } catch (error) {
      logger.error('Error in getCart controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart',
      });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const item: ICartItem = req.body;

      // Validate required fields
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
    } catch (error) {
      logger.error('Error in addItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
      });
    }
  }

  async updateItemQuantity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;
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
    } catch (error) {
      logger.error('Error in updateItemQuantity controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update item quantity',
      });
    }
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;
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
    } catch (error) {
      logger.error('Error in removeItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
      });
    }
  }

  async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;
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
    } catch (error) {
      logger.error('Error in clearCart controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
      });
    }
  }
}
