import { Request, Response } from 'express';
export declare class AddressController {
    getUserAddresses: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAddressById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
    setDefaultAddress: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const addressController: AddressController;
//# sourceMappingURL=address.controller.d.ts.map