import { PrismaClient, Address, AddressType } from '@prisma/client';
import { ConflictError, NotFoundError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Types
export interface CreateAddressData {
  type: AddressType;
  region: string;
  district: string;
  city?: string;
  mahalla?: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode?: string;
  landmark?: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  type?: AddressType;
  region?: string;
  district?: string;
  city?: string;
  mahalla?: string;
  street?: string;
  house?: string;
  apartment?: string;
  postalCode?: string;
  landmark?: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface GetAddressesFilters {
  type?: AddressType;
  isActive?: boolean;
}

export class AddressService {
  /**
   * Get user addresses
   */
  async getUserAddresses(userId: string, filters: GetAddressesFilters = {}): Promise<Address[]> {
    try {
      const { type, isActive } = filters;
      const where: any = { userId };

      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive;

      const addresses = await prisma.address.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      return addresses;
    } catch (error) {
      logger.error('Failed to get user addresses:', error);
      throw error;
    }
  }

  /**
   * Create a new address
   */
  async createAddress(userId: string, addressData: CreateAddressData): Promise<Address> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // If this is the first address or explicitly set as default, make it default
      const existingAddresses = await prisma.address.count({
        where: { userId, isActive: true },
      });

      const shouldBeDefault = existingAddresses === 0 || addressData.isDefault === true;

      // If this address should be default, unset other default addresses
      if (shouldBeDefault) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Create the address
      const address = await prisma.address.create({
        data: {
          userId,
          type: addressData.type,
          region: addressData.region,
          district: addressData.district,
          city: addressData.city,
          mahalla: addressData.mahalla,
          street: addressData.street,
          house: addressData.house,
          apartment: addressData.apartment,
          postalCode: addressData.postalCode,
          landmark: addressData.landmark,
          instructions: addressData.instructions,
          isDefault: shouldBeDefault,
        },
      });

      logger.info('Address created successfully', {
        userId,
        addressId: address.id,
        type: address.type,
        isDefault: address.isDefault,
      });

      return address;
    } catch (error) {
      logger.error('Failed to create address:', error);
      throw error;
    }
  }

  /**
   * Get address by ID
   */
  async getAddressById(userId: string, addressId: string): Promise<Address> {
    try {
      const address = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId,
          isActive: true,
        },
      });

      if (!address) {
        throw new NotFoundError('Address not found');
      }

      return address;
    } catch (error) {
      logger.error('Failed to get address by ID:', error);
      throw error;
    }
  }

  /**
   * Update address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateData: UpdateAddressData
  ): Promise<Address> {
    try {
      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId,
          isActive: true,
        },
      });

      if (!existingAddress) {
        throw new NotFoundError('Address not found');
      }

      // If setting as default, unset other default addresses
      if (updateData.isDefault === true) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Update the address
      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: updateData,
      });

      logger.info('Address updated successfully', {
        userId,
        addressId,
        changes: Object.keys(updateData),
      });

      return updatedAddress;
    } catch (error) {
      logger.error('Failed to update address:', error);
      throw error;
    }
  }

  /**
   * Delete address (soft delete)
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId,
          isActive: true,
        },
      });

      if (!existingAddress) {
        throw new NotFoundError('Address not found');
      }

      // Soft delete the address
      await prisma.address.update({
        where: { id: addressId },
        data: { isActive: false },
      });

      // If this was the default address, make another address default
      if (existingAddress.isDefault) {
        const nextAddress = await prisma.address.findFirst({
          where: {
            userId,
            isActive: true,
            id: { not: addressId },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
          await prisma.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }

      logger.info('Address deleted successfully', {
        userId,
        addressId,
      });
    } catch (error) {
      logger.error('Failed to delete address:', error);
      throw error;
    }
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<Address> {
    try {
      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId,
          isActive: true,
        },
      });

      if (!existingAddress) {
        throw new NotFoundError('Address not found');
      }

      // Unset other default addresses
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      // Set this address as default
      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      logger.info('Address set as default successfully', {
        userId,
        addressId,
      });

      return updatedAddress;
    } catch (error) {
      logger.error('Failed to set default address:', error);
      throw error;
    }
  }

  /**
   * Get default address for user
   */
  async getDefaultAddress(userId: string, type?: AddressType): Promise<Address | null> {
    try {
      const where: any = {
        userId,
        isDefault: true,
        isActive: true,
      };

      if (type) where.type = type;

      const address = await prisma.address.findFirst({
        where,
      });

      return address;
    } catch (error) {
      logger.error('Failed to get default address:', error);
      throw error;
    }
  }

  /**
   * Check if address exists
   */
  async addressExists(userId: string, addressId: string): Promise<boolean> {
    try {
      const address = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId,
          isActive: true,
        },
        select: { id: true },
      });

      return !!address;
    } catch (error) {
      logger.error('Failed to check if address exists:', error);
      throw error;
    }
  }
}

export const addressService = new AddressService();
