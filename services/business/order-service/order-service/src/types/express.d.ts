import 'express';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId: string;
        role: string;
        email?: string;
      };
      session?: {
        id: string;
      };
    }
  }
}
