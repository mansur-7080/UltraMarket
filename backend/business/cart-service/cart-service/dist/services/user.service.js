"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserServiceClient = void 0;
const logger_1 = require("../utils/logger");
class UserServiceClient {
    baseUrl;
    constructor(baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3000') {
        this.baseUrl = baseUrl;
    }
    async getUserById(userId) {
        try {
            logger_1.logger.info(`Fetching user with ID: ${userId}`);
            return {
                id: userId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                isActive: true,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching user with ID ${userId}:`, error);
            throw error;
        }
    }
    async validateUser(userId) {
        try {
            logger_1.logger.info(`Validating user with ID: ${userId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error validating user with ID ${userId}:`, error);
            throw error;
        }
    }
}
exports.UserServiceClient = UserServiceClient;
exports.userService = new UserServiceClient();
exports.default = exports.userService;
//# sourceMappingURL=user.service.js.map