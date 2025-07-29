"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const logger = console;
class ApiError extends Error {
    statusCode;
    message;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}
const prisma = new client_1.PrismaClient();
class AuthService {
    constructor() {
        logger.debug('Auth Service initialized');
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map