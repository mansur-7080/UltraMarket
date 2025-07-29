export interface UserService {
    getUserById(userId: string): Promise<any>;
    validateUser(userId: string): Promise<boolean>;
}
export declare class UserServiceClient implements UserService {
    private baseUrl;
    constructor(baseUrl?: string);
    getUserById(userId: string): Promise<any>;
    validateUser(userId: string): Promise<boolean>;
}
export declare const userService: UserServiceClient;
export default userService;
//# sourceMappingURL=user.service.d.ts.map