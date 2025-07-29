"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockUserService = {
    getUserById: globals_1.jest.fn(),
    validateUser: globals_1.jest.fn(),
};
mockUserService.getUserById.mockImplementation(async (userId) => {
    return {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
    };
});
mockUserService.validateUser.mockImplementation(async (userId) => {
    return true;
});
exports.default = mockUserService;
//# sourceMappingURL=user.service.js.map