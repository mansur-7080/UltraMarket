"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const authController = new authController_1.AuthController();
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/logout', authMiddleware_1.authenticateToken, authController.logout.bind(authController));
router.get('/profile', authMiddleware_1.authenticateToken, authController.getProfile.bind(authController));
router.put('/change-password', authMiddleware_1.authenticateToken, authController.changePassword.bind(authController));
router.post('/verify', authMiddleware_1.authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
            user: req.user,
        },
    });
});
router.get('/stats', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }
        const { AuthService } = require('../services/authService');
        const authService = new AuthService();
        const stats = await authService.getAuthStats();
        return res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map