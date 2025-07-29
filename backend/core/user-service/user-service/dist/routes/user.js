"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const admin_1 = require("../middleware/admin");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
const updateProfileValidation = [
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .custom((value) => {
        if (value) {
            const phoneRegex = /^(\+998|998|8)?[0-9]{9}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                throw new Error("O'zbek telefon raqami formatida kiriting (+998901234567)");
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Valid gender is required'),
];
const updateAddressValidation = [
    (0, express_validator_1.body)('type')
        .isIn(['home', 'work', 'billing', 'shipping'])
        .withMessage('Valid address type is required'),
    (0, express_validator_1.body)('region').trim().notEmpty().withMessage('Viloyat majburiy'),
    (0, express_validator_1.body)('district').trim().notEmpty().withMessage('Tuman majburiy'),
    (0, express_validator_1.body)('street').trim().notEmpty().withMessage("Ko'cha nomi majburiy"),
    (0, express_validator_1.body)('house').trim().notEmpty().withMessage('Uy raqami majburiy'),
    (0, express_validator_1.body)('city').optional().trim(),
    (0, express_validator_1.body)('mahalla').optional().trim(),
    (0, express_validator_1.body)('apartment').optional().trim(),
    (0, express_validator_1.body)('postalCode').optional().trim(),
    (0, express_validator_1.body)('landmark').optional().trim(),
    (0, express_validator_1.body)('instructions').optional().trim(),
    (0, express_validator_1.body)('country')
        .optional()
        .equals('UZ')
        .withMessage("Faqat O'zbekiston manzillari qabul qilinadi"),
    (0, express_validator_1.body)('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
];
router.get('/', auth_1.authMiddleware, admin_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const result = await userController.getAllUsers({
        page: Number(page),
        limit: Number(limit),
        search: String(search || ''),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder),
    });
    res.status(200).json(result);
}));
router.get('/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await userController.getUserById(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: user,
    });
}));
router.put('/profile', auth_1.authMiddleware, updateProfileValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    const updatedUser = await userController.updateProfile(req.user.id, req.body);
    res.status(200).json({
        success: true,
        data: updatedUser,
    });
}));
router.get('/profile', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await userController.getProfile(req.user.id);
    res.status(200).json({
        success: true,
        data: profile,
    });
}));
router.post('/addresses', auth_1.authMiddleware, updateAddressValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    const address = await userController.addAddress(req.user.id, req.body);
    res.status(201).json({
        success: true,
        data: address,
    });
}));
router.get('/addresses', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const addresses = await userController.getAddresses(req.user.id);
    res.status(200).json({
        success: true,
        data: addresses,
    });
}));
router.put('/addresses/:id', auth_1.authMiddleware, updateAddressValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    const address = await userController.updateAddress(req.user.id, req.params.id, req.body);
    res.status(200).json({
        success: true,
        data: address,
    });
}));
router.delete('/addresses/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await userController.deleteAddress(req.user.id, req.params.id);
    res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
    });
}));
router.post('/upload-avatar', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const avatarUrl = await userController.uploadAvatar(req.user.id, req.file);
    res.status(200).json({
        success: true,
        data: { avatarUrl },
    });
}));
router.delete('/avatar', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await userController.deleteAvatar(req.user.id);
    res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully',
    });
}));
router.post('/deactivate', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await userController.deactivateAccount(req.user.id, req.body.reason);
    res.status(200).json({
        success: true,
        message: 'Account deactivated successfully',
    });
}));
router.post('/reactivate', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await userController.reactivateAccount(req.user.id);
    res.status(200).json({
        success: true,
        message: 'Account reactivated successfully',
    });
}));
router.get('/:id/orders', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const orders = await userController.getUserOrders(req.params.id, {
        page: Number(page),
        limit: Number(limit),
        status: status ? String(status) : undefined,
    });
    res.status(200).json({
        success: true,
        data: orders,
    });
}));
router.get('/:id/reviews', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const reviews = await userController.getUserReviews(req.params.id, {
        page: Number(page),
        limit: Number(limit),
    });
    res.status(200).json({
        success: true,
        data: reviews,
    });
}));
exports.default = router;
//# sourceMappingURL=user.js.map