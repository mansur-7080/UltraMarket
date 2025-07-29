import { Request, Response } from 'express';
export declare class PaymentController {
    private clickService;
    private paymeService;
    constructor();
    createPayment(req: Request, res: Response): Promise<void>;
    handleClickWebhook(req: Request, res: Response): Promise<void>;
    handlePaymeWebhook(req: Request, res: Response): Promise<void>;
    getPaymentStatus(req: Request, res: Response): Promise<void>;
    getPaymentMethods(req: Request, res: Response): Promise<void>;
    healthCheck(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=payment.controller.d.ts.map