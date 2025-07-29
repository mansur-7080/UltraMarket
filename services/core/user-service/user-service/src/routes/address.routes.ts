import { Router } from 'express';
import { addressController } from '../controllers/address.controller';
import { authenticate, authorizeSelfOrAdmin } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createAddressSchema,
  updateAddressSchema,
  getAddressesQuerySchema,
  userIdParamSchema,
  addressIdParamSchema,
  userIdAndAddressIdParamSchema,
} from '../schemas/user.schemas';

const router = Router();

/**
 * @swagger
 * /api/v1/addresses/user/{userId}:
 *   get:
 *     summary: Get user addresses
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SHIPPING, BILLING]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get(
  '/user/:userId',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdParamSchema),
  validateQuery(getAddressesQuerySchema),
  addressController.getUserAddresses
);

/**
 * @swagger
 * /api/v1/addresses/user/{userId}:
 *   post:
 *     summary: Create a new address for user
 *     tags: [Addresses]
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
 *             required:
 *               - type
 *               - region
 *               - district
 *               - street
 *               - house
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SHIPPING, BILLING]
 *               region:
 *                 type: string
 *                 description: Viloyat
 *               district:
 *                 type: string
 *                 description: Tuman
 *               city:
 *                 type: string
 *                 description: Shahar
 *               mahalla:
 *                 type: string
 *                 description: Mahalla
 *               street:
 *                 type: string
 *                 description: Ko'cha nomi
 *               house:
 *                 type: string
 *                 description: Uy raqami
 *               apartment:
 *                 type: string
 *                 description: Xonadon raqami
 *               postalCode:
 *                 type: string
 *                 description: Pochta indeksi
 *               landmark:
 *                 type: string
 *                 description: Mo'ljal
 *               instructions:
 *                 type: string
 *                 description: Yetkazib berish ko'rsatmalari
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post(
  '/user/:userId',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdParamSchema),
  validateBody(createAddressSchema),
  addressController.createAddress
);

/**
 * @swagger
 * /api/v1/addresses/user/{userId}/address/{addressId}:
 *   get:
 *     summary: Get address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Address not found
 */
router.get(
  '/user/:userId/address/:addressId',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdAndAddressIdParamSchema),
  addressController.getAddressById
);

/**
 * @swagger
 * /api/v1/addresses/user/{userId}/address/{addressId}:
 *   put:
 *     summary: Update address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: addressId
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
 *               type:
 *                 type: string
 *                 enum: [SHIPPING, BILLING]
 *               region:
 *                 type: string
 *                 description: Viloyat
 *               district:
 *                 type: string
 *                 description: Tuman
 *               city:
 *                 type: string
 *                 description: Shahar
 *               mahalla:
 *                 type: string
 *                 description: Mahalla
 *               street:
 *                 type: string
 *                 description: Ko'cha nomi
 *               house:
 *                 type: string
 *                 description: Uy raqami
 *               apartment:
 *                 type: string
 *                 description: Xonadon raqami
 *               postalCode:
 *                 type: string
 *                 description: Pochta indeksi
 *               landmark:
 *                 type: string
 *                 description: Mo'ljal
 *               instructions:
 *                 type: string
 *                 description: Yetkazib berish ko'rsatmalari
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Address not found
 */
router.put(
  '/user/:userId/address/:addressId',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdAndAddressIdParamSchema),
  validateBody(updateAddressSchema),
  addressController.updateAddress
);

/**
 * @swagger
 * /api/v1/addresses/user/{userId}/address/{addressId}:
 *   delete:
 *     summary: Delete address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Address not found
 */
router.delete(
  '/user/:userId/address/:addressId',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdAndAddressIdParamSchema),
  addressController.deleteAddress
);

/**
 * @swagger
 * /api/v1/addresses/user/{userId}/address/{addressId}/default:
 *   put:
 *     summary: Set address as default
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Address set as default successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Address not found
 */
router.put(
  '/user/:userId/address/:addressId/default',
  authenticate,
  authorizeSelfOrAdmin(),
  validateParams(userIdAndAddressIdParamSchema),
  addressController.setDefaultAddress
);

export default router;
