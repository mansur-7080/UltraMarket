import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();
const userController = new UserController();

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('phone')
    .optional()
    .custom((value) => {
      if (value) {
        // O'zbek telefon raqami validatsiyasi
        const phoneRegex = /^(\+998|998|8)?[0-9]{9}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          throw new Error("O'zbek telefon raqami formatida kiriting (+998901234567)");
        }
      }
      return true;
    }),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Valid gender is required'),
];

const updateAddressValidation = [
  body('type')
    .isIn(['home', 'work', 'billing', 'shipping'])
    .withMessage('Valid address type is required'),
  body('region').trim().notEmpty().withMessage('Viloyat majburiy'),
  body('district').trim().notEmpty().withMessage('Tuman majburiy'),
  body('street').trim().notEmpty().withMessage("Ko'cha nomi majburiy"),
  body('house').trim().notEmpty().withMessage('Uy raqami majburiy'),
  body('city').optional().trim(),
  body('mahalla').optional().trim(),
  body('apartment').optional().trim(),
  body('postalCode').optional().trim(),
  body('landmark').optional().trim(),
  body('instructions').optional().trim(),
  body('country')
    .optional()
    .equals('UZ')
    .withMessage("Faqat O'zbekiston manzillari qabul qilinadi"),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
];

// Routes
/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await userController.getAllUsers({
      page: Number(page),
      limit: Number(limit),
      search: String(search || ''),
      sortBy: String(sortBy),
      sortOrder: String(sortOrder) as 'asc' | 'desc',
    });

    res.status(200).json(result);
  })
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await userController.getUserById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authMiddleware,
  updateProfileValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
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
  })
);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profile = await userController.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  })
);

/**
 * @route   POST /api/v1/users/addresses
 * @desc    Add new address
 * @access  Private
 */
router.post(
  '/addresses',
  authMiddleware,
  updateAddressValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
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
  })
);

/**
 * @route   GET /api/v1/users/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get(
  '/addresses',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const addresses = await userController.getAddresses(req.user.id);
    res.status(200).json({
      success: true,
      data: addresses,
    });
  })
);

/**
 * @route   PUT /api/v1/users/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put(
  '/addresses/:id',
  authMiddleware,
  updateAddressValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
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
  })
);

/**
 * @route   DELETE /api/v1/users/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete(
  '/addresses/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await userController.deleteAddress(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  })
);

/**
 * @route   POST /api/v1/users/upload-avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  '/upload-avatar',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const avatarUrl = await userController.uploadAvatar(req.user.id, req.file);
    res.status(200).json({
      success: true,
      data: { avatarUrl },
    });
  })
);

/**
 * @route   DELETE /api/v1/users/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete(
  '/avatar',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await userController.deleteAvatar(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  })
);

/**
 * @route   POST /api/v1/users/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.post(
  '/deactivate',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await userController.deactivateAccount(req.user.id, req.body.reason);
    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  })
);

/**
 * @route   POST /api/v1/users/reactivate
 * @desc    Reactivate user account
 * @access  Private
 */
router.post(
  '/reactivate',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await userController.reactivateAccount(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Account reactivated successfully',
    });
  })
);

/**
 * @route   GET /api/v1/users/:id/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get(
  '/:id/orders',
  authMiddleware,
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * @route   GET /api/v1/users/:id/reviews
 * @desc    Get user reviews
 * @access  Private
 */
router.get(
  '/:id/reviews',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await userController.getUserReviews(req.params.id, {
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  })
);

export default router;
