"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
const forgotPasswordValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
];
router.post('/register', registerValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    const result = await authController.register(req.body);
    res.status(201).json(result);
}));
router.post('/login', loginValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    const result = await authController.login(req.body);
    res.status(200).json(result);
}));
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authController.refreshToken(req.body.refreshToken);
    res.status(200).json(result);
}));
router.post('/logout', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await authController.logout(req.user.id);
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
}));
router.post('/forgot-password', forgotPasswordValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    await authController.forgotPassword(req.body.email);
    res.status(200).json({
        success: true,
        message: 'Password reset email sent',
    });
}));
router.post('/reset-password', resetPasswordValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    await authController.resetPassword(req.body.token, req.body.password);
    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
    });
}));
router.post('/verify-email', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await authController.verifyEmail(req.body.token);
    res.status(200).json({
        success: true,
        message: 'Email verified successfully',
    });
}));
router.post('/resend-verification', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await authController.resendVerificationEmail(req.user.id);
    res.status(200).json({
        success: true,
        message: 'Verification email sent',
    });
}));
router.get('/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await authController.getCurrentUser(req.user.id);
    res.status(200).json({
        success: true,
        data: user,
    });
}));
router.post('/change-password', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await authController.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map