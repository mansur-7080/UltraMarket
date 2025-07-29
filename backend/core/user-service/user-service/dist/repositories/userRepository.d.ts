import { User, Address } from '@prisma/client';
import { UserRole } from '../types/auth';
interface CreateUserData {
    email: string;
    username: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
    profileImage?: string;
    bio?: string;
}
interface UpdateUserData {
    email?: string;
    username?: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
    profileImage?: string;
    bio?: string;
    lastLoginAt?: Date;
}
interface UserWithAddresses extends User {
    addresses: Address[];
}
interface PaginatedUsers {
    users: UserWithAddresses[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
interface FindUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
    sortOrder?: 'asc' | 'desc';
}
export interface IUserRepository {
    create(user: CreateUserData): Promise<UserWithAddresses>;
    findById(id: string): Promise<UserWithAddresses | null>;
    findByEmail(email: string): Promise<UserWithAddresses | null>;
    findByUsername(username: string): Promise<UserWithAddresses | null>;
    update(id: string, data: UpdateUserData): Promise<UserWithAddresses>;
    delete(id: string): Promise<void>;
    findMany(options: FindUsersOptions): Promise<PaginatedUsers>;
    count(filters?: {
        isActive?: boolean;
        role?: UserRole;
    }): Promise<number>;
    findByEmailOrUsername(emailOrUsername: string): Promise<UserWithAddresses | null>;
}
export declare class UserRepository implements IUserRepository {
    create(userData: CreateUserData): Promise<UserWithAddresses>;
    findById(id: string): Promise<UserWithAddresses | null>;
    findByEmail(email: string): Promise<UserWithAddresses | null>;
    findByUsername(username: string): Promise<UserWithAddresses | null>;
    update(id: string, data: UpdateUserData): Promise<UserWithAddresses>;
    delete(id: string): Promise<void>;
    findMany(options: FindUsersOptions): Promise<PaginatedUsers>;
    count(filters?: {
        isActive?: boolean;
        role?: UserRole;
    }): Promise<number>;
    findByEmailOrUsername(emailOrUsername: string): Promise<UserWithAddresses | null>;
}
export declare const userRepository: UserRepository;
export {};
//# sourceMappingURL=userRepository.d.ts.map