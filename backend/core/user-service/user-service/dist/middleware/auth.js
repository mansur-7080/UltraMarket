"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const shared_1 = require("@ultramarket/shared");
const shared_2 = require("@ultramarket/shared");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new shared_2.UnauthorizedError('Authorization token required');
        }
        const token = authHeader.substring(7);
        const payload = await (0, shared_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        if (error instanceof shared_2.UnauthorizedError) {
            res.status(401).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        if (!(0, shared_1.hasRole)(req.user.role, roles)) {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map