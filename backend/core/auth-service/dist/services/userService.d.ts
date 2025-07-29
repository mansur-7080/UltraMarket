import { User } from '@prisma/client';
export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
}
export declare class UserService {
    createUser(data: CreateUserData): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateUser(id: string, data: UpdateUserData): Promise<User>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    deactivateUser(id: string): Promise<User>;
    activateUser(id: string): Promise<User>;
    getAllUsers(page?: number, limit?: number, role?: string): Promise<{
        users: User[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    deleteUser(id: string): Promise<void>;
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        usersByRole: Record<string, number>;
    }>;
}
//# sourceMappingURL=userService.d.ts.map