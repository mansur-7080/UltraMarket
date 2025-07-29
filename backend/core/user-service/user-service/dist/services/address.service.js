"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressService = exports.AddressService = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class AddressService {
    async getUserAddresses(userId, filters = {}) {
        try {
            const { type, isActive } = filters;
            const where = { userId };
            if (type)
                where.type = type;
            if (isActive !== undefined)
                where.isActive = isActive;
            const addresses = await prisma.address.findMany({
                where,
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            });
            return addresses;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user addresses:', error);
            throw error;
        }
    }
    async createAddress(userId, addressData) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            const existingAddresses = await prisma.address.count({
                where: { userId, isActive: true },
            });
            const shouldBeDefault = existingAddresses === 0 || addressData.isDefault === true;
            if (shouldBeDefault) {
                await prisma.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
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
            logger_1.logger.info('Address created successfully', {
                userId,
                addressId: address.id,
                type: address.type,
                isDefault: address.isDefault,
            });
            return address;
        }
        catch (error) {
            logger_1.logger.error('Failed to create address:', error);
            throw error;
        }
    }
    async getAddressById(userId, addressId) {
        try {
            const address = await prisma.address.findFirst({
                where: {
                    id: addressId,
                    userId,
                    isActive: true,
                },
            });
            if (!address) {
                throw new error_middleware_1.NotFoundError('Address not found');
            }
            return address;
        }
        catch (error) {
            logger_1.logger.error('Failed to get address by ID:', error);
            throw error;
        }
    }
    async updateAddress(userId, addressId, updateData) {
        try {
            const existingAddress = await prisma.address.findFirst({
                where: {
                    id: addressId,
                    userId,
                    isActive: true,
                },
            });
            if (!existingAddress) {
                throw new error_middleware_1.NotFoundError('Address not found');
            }
            if (updateData.isDefault === true) {
                await prisma.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            const updatedAddress = await prisma.address.update({
                where: { id: addressId },
                data: updateData,
            });
            logger_1.logger.info('Address updated successfully', {
                userId,
                addressId,
                changes: Object.keys(updateData),
            });
            return updatedAddress;
        }
        catch (error) {
            logger_1.logger.error('Failed to update address:', error);
            throw error;
        }
    }
    async deleteAddress(userId, addressId) {
        try {
            const existingAddress = await prisma.address.findFirst({
                where: {
                    id: addressId,
                    userId,
                    isActive: true,
                },
            });
            if (!existingAddress) {
                throw new error_middleware_1.NotFoundError('Address not found');
            }
            await prisma.address.update({
                where: { id: addressId },
                data: { isActive: false },
            });
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
            logger_1.logger.info('Address deleted successfully', {
                userId,
                addressId,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete address:', error);
            throw error;
        }
    }
    async setDefaultAddress(userId, addressId) {
        try {
            const existingAddress = await prisma.address.findFirst({
                where: {
                    id: addressId,
                    userId,
                    isActive: true,
                },
            });
            if (!existingAddress) {
                throw new error_middleware_1.NotFoundError('Address not found');
            }
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
            const updatedAddress = await prisma.address.update({
                where: { id: addressId },
                data: { isDefault: true },
            });
            logger_1.logger.info('Address set as default successfully', {
                userId,
                addressId,
            });
            return updatedAddress;
        }
        catch (error) {
            logger_1.logger.error('Failed to set default address:', error);
            throw error;
        }
    }
    async getDefaultAddress(userId, type) {
        try {
            const where = {
                userId,
                isDefault: true,
                isActive: true,
            };
            if (type)
                where.type = type;
            const address = await prisma.address.findFirst({
                where,
            });
            return address;
        }
        catch (error) {
            logger_1.logger.error('Failed to get default address:', error);
            throw error;
        }
    }
    async addressExists(userId, addressId) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to check if address exists:', error);
            throw error;
        }
    }
}
exports.AddressService = AddressService;
exports.addressService = new AddressService();
//# sourceMappingURL=address.service.js.map