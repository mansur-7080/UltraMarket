import { User } from '@ultramarket/common';
import type { UserResponse } from '@ultramarket/common';
import { Request } from 'express';
export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}
export interface UserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    isActive: boolean;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserService {
    private emailTransporter;
    constructor();
    private initializeEmailService;
    private sendEmail;
    private generateEmailVerificationTemplate;
    private generatePasswordResetTemplate;
    registerUser(userData: CreateUserData): Promise<{
        user: {
            addresses: User[];
        };
        tokens: any;
    }>;
    loginUser(email: string, password: string, req?: Request): Promise<{
        user: {
            addresses: User[];
        };
        tokens: any;
    }>;
    getUserById(userId: string): Promise<UserResponse>;
    updateUser(userId: string, updateData: UpdateUserData): Promise<UserResponse>;
    deleteUser(userId: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<any>;
    logoutUser(userId: string, accessToken?: string, sessionId?: string): Promise<void>;
    verifyEmail(token: string): Promise<boolean>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
}
export declare const userService: UserService;
//# sourceMappingURL=userService.d.ts.map