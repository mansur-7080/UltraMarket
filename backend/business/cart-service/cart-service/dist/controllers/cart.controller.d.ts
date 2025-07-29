import { Request, Response } from 'express';
export declare class CartController {
    private cartService;
    getCart(req: Request, res: Response): Promise<void>;
    addItem(req: Request, res: Response): Promise<void>;
    updateItemQuantity(req: Request, res: Response): Promise<void>;
    removeItem(req: Request, res: Response): Promise<void>;
    clearCart(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=cart.controller.d.ts.map