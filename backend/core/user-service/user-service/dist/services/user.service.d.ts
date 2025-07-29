import { User, UserRole, Prisma } from '@prisma/client';
export interface CreateUserData {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
    bio?: string;
    profileImage?: string;
}
export interface UpdateUserData {
    username?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    bio?: string;
    profileImage?: string;
}
export interface AdminUpdateUserData extends UpdateUserData {
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
}
export type UserWithAddresses = Prisma.UserGetPayload<{
    include: {
        addresses: true;
    };
}>;
export interface PaginatedUsers {
    users: UserWithAddresses[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface FindUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
    sortOrder?: 'asc' | 'desc';
}
export declare class UserService {
    createUser(userData: CreateUserData): Promise<UserWithAddresses>;
    getUserById(userId: string): Promise<UserWithAddresses>;
    getUserByEmail(email: string): Promise<UserWithAddresses>;
    getUserByUsername(username: string): Promise<UserWithAddresses>;
    updateUser(userId: string, updateData: UpdateUserData): Promise<UserWithAddresses>;
    adminUpdateUser(userId: string, updateData: AdminUpdateUserData): Promise<UserWithAddresses>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    updateEmail(userId: string, newEmail: string, password: string): Promise<UserWithAddresses>;
    deleteUser(userId: string): Promise<void>;
    getUsers(options: FindUsersOptions): Promise<PaginatedUsers>;
    getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        verified: number;
        unverified: number;
        byRole: Record<UserRole, number>;
    }>;
    updateLastLogin(userId: string): Promise<void>;
    userExists(userId: string): Promise<boolean>;
    transformUser(user: User): Omit<User, 'passwordHash'>;
    transformUserWithAddresses(user: UserWithAddresses): Omit<UserWithAddresses, 'passwordHash'>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map