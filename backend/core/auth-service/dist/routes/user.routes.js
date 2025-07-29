"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_schemas_1 = require("../schemas/auth.schemas");
const router = (0, express_1.Router)();
exports.userRoutes = router;
router.get('/profile', auth_middleware_1.authMiddleware, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/profile', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateRequest)(auth_schemas_1.updateProfileSchema), async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'Profile update not yet implemented',
    });
});
router.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'User list not yet implemented',
    });
});
//# sourceMappingURL=user.routes.js.map