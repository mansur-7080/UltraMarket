import { UserRole, UserStatus } from '@prisma/client';
export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    password: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    status: UserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserService {
    constructor();
    createUser(data: CreateUserData): Promise<User>;
    getUserById(userId: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    updateUser(userId: string, data: UpdateUserData): Promise<User>;
    updateUserStatus(userId: string, status: UserStatus): Promise<User>;
    updateLastLogin(userId: string): Promise<void>;
    verifyEmail(userId: string): Promise<User>;
    verifyPhone(userId: string): Promise<User>;
    changePassword(userId: string, newPassword: string): Promise<void>;
    deleteUser(userId: string): Promise<void>;
}
//# sourceMappingURL=user.service.d.ts.map