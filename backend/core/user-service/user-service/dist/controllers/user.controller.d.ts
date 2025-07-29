import { Request, Response, NextFunction } from 'express';
export declare class UserController {
    createUser: (req: Request, res: Response, next: NextFunction) => void;
    getUsers: (req: Request, res: Response, next: NextFunction) => void;
    getCurrentUser: (req: Request, res: Response, next: NextFunction) => void;
    updateCurrentUser: (req: Request, res: Response, next: NextFunction) => void;
    changePassword: (req: Request, res: Response, next: NextFunction) => void;
    updateEmail: (req: Request, res: Response, next: NextFunction) => void;
    deleteCurrentUser: (req: Request, res: Response, next: NextFunction) => void;
    getUserStats: (req: Request, res: Response, next: NextFunction) => void;
    getUserById: (req: Request, res: Response, next: NextFunction) => void;
    updateUserById: (req: Request, res: Response, next: NextFunction) => void;
    deleteUserById: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const userController: UserController;
//# sourceMappingURL=user.controller.d.ts.map