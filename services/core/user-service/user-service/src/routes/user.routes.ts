import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize, authorizeSelfOrAdmin } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  updateEmailSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from '../schemas/user.schemas';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security: []
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
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               profileImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */
router.post('/', validateBody(createUserSchema), userController.createUser);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get users with pagination and filtering
 *     tags: [Users]
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
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateQuery(getUsersQuerySchema),
  userController.getUsers
);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, userController.getCurrentUser);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               profileImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username already exists
 */
router.put('/me', authenticate, validateBody(updateUserSchema), userController.updateCurrentUser);

/**
 * @swagger
 * /api/v1/users/me/password:
 *   put:
 *     summary: Change current user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Current password is incorrect
 */
router.put(
  '/me/password',
  authenticate,
  validateBody(changePasswordSchema),
  userController.changePassword
);

/**
 * @swagger
 * /api/v1/users/me/email:
 *   put:
 *     summary: Update current user email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Password is incorrect
 *       409:
 *         description: Email already exists
 */
router.put('/me/email', authenticate, validateBody(updateEmailSchema), userController.updateEmail);

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/me', authenticate, userController.deleteCurrentUser);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), userController.getUserStats);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
router.get(
  '/:userId',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdParamSchema),
  userController.getUserById
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   put:
 *     summary: Update user by ID (admin only)
 *     tags: [Users]
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
  '/:userId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateParams(userIdParamSchema),
  userController.updateUserById
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: Delete user by ID (admin only)
 *     tags: [Users]
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
router.delete(
  '/:userId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateParams(userIdParamSchema),
  userController.deleteUserById
);

export default router;
