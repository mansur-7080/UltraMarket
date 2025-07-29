"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.adminRoutes = router;
router.get('/dashboard', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'Admin dashboard not yet implemented',
    });
});
router.get('/users', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'User management not yet implemented',
    });
});
//# sourceMappingURL=admin.routes.js.map