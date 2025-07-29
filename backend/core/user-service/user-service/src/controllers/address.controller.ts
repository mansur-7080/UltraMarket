import { Request, Response } from 'express';
import { addressService } from '../services/address.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class AddressController {
  /**
   * Get user addresses
   */
  getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const filters = req.query;

    const addresses = await addressService.getUserAddresses(userId, filters);

    res.json({
      success: true,
      data: addresses,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Create a new address
   */
  createAddress = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const addressData = req.body;

    const address = await addressService.createAddress(userId, addressData);

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get address by ID
   */
  getAddressById = asyncHandler(async (req: Request, res: Response) => {
    const { userId, addressId } = req.params;

    const address = await addressService.getAddressById(userId, addressId);

    res.json({
      success: true,
      data: address,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Update address
   */
  updateAddress = asyncHandler(async (req: Request, res: Response) => {
    const { userId, addressId } = req.params;
    const updateData = req.body;

    const address = await addressService.updateAddress(userId, addressId, updateData);

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Delete address
   */
  deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    const { userId, addressId } = req.params;

    await addressService.deleteAddress(userId, addressId);

    res.json({
      success: true,
      message: 'Address deleted successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Set address as default
   */
  setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
    const { userId, addressId } = req.params;

    const address = await addressService.setDefaultAddress(userId, addressId);

    res.json({
      success: true,
      message: 'Address set as default successfully',
      data: address,
      timestamp: new Date().toISOString(),
    });
  });
}

export const addressController = new AddressController();
