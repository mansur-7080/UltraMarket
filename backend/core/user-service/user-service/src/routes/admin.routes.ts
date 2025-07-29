import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from '../schemas/user.schemas';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /api/v1/admin/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\\+998[0-9]{9}$'
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, SELLER, ADMIN, SUPER_ADMIN]
 *                 default: CUSTOMER
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isEmailVerified:
 *                 type: boolean
 *                 default: false
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               profileImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/users', validateBody(adminCreateUserSchema), userController.createUser);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with advanced filtering (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, SELLER, ADMIN, SUPER_ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, email, firstName, lastName]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/users', validateQuery(getUsersQuerySchema), userController.getUsers);

/**
 * @swagger
 * /api/v1/admin/users/stats:
 *   get:
 *     summary: Get user statistics (admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     active:
 *                       type: number
 *                     inactive:
 *                       type: number
 *                     verified:
 *                       type: number
 *                     unverified:
 *                       type: number
 *                     byRole:
 *                       type: object
 *                       properties:
 *                         CUSTOMER:
 *                           type: number
 *                         SELLER:
 *                           type: number
 *                         ADMIN:
 *                           type: number
 *                         SUPER_ADMIN:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/users/stats', userController.getUserStats);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/users/:userId', validateParams(userIdParamSchema), userController.getUserById);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   put:
 *     summary: Update user by ID (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\\+998[0-9]{9}$'
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, SELLER, ADMIN, SUPER_ADMIN]
 *               isActive:
 *                 type: boolean
 *               isEmailVerified:
 *                 type: boolean
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               profileImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/users/:userId',
  validateParams(userIdParamSchema),
  validateBody(adminUpdateUserSchema),
  userController.updateUserById
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   delete:
 *     summary: Delete user by ID (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/users/:userId', validateParams(userIdParamSchema), userController.deleteUserById);

export default router;
