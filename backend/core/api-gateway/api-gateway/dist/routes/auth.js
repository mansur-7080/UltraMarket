"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.get('/status', auth_1.authMiddleware, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user,
        timestamp: new Date().toISOString(),
    });
});
router.post('/validate', auth_1.authMiddleware, (req, res) => {
    res.json({
        valid: true,
        user: req.user,
        timestamp: new Date().toISOString(),
    });
});
router.post('/logout', auth_1.authMiddleware, (req, res) => {
    res.json({
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=auth.js.map