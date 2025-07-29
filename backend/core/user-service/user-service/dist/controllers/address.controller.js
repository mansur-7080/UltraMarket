"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressController = exports.AddressController = void 0;
const address_service_1 = require("../services/address.service");
const error_middleware_1 = require("../middleware/error.middleware");
class AddressController {
    getUserAddresses = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId } = req.params;
        const filters = req.query;
        const addresses = await address_service_1.addressService.getUserAddresses(userId, filters);
        res.json({
            success: true,
            data: addresses,
            timestamp: new Date().toISOString(),
        });
    });
    createAddress = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId } = req.params;
        const addressData = req.body;
        const address = await address_service_1.addressService.createAddress(userId, addressData);
        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: address,
            timestamp: new Date().toISOString(),
        });
    });
    getAddressById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId, addressId } = req.params;
        const address = await address_service_1.addressService.getAddressById(userId, addressId);
        res.json({
            success: true,
            data: address,
            timestamp: new Date().toISOString(),
        });
    });
    updateAddress = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId, addressId } = req.params;
        const updateData = req.body;
        const address = await address_service_1.addressService.updateAddress(userId, addressId, updateData);
        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address,
            timestamp: new Date().toISOString(),
        });
    });
    deleteAddress = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId, addressId } = req.params;
        await address_service_1.addressService.deleteAddress(userId, addressId);
        res.json({
            success: true,
            message: 'Address deleted successfully',
            timestamp: new Date().toISOString(),
        });
    });
    setDefaultAddress = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId, addressId } = req.params;
        const address = await address_service_1.addressService.setDefaultAddress(userId, addressId);
        res.json({
            success: true,
            message: 'Address set as default successfully',
            data: address,
            timestamp: new Date().toISOString(),
        });
    });
}
exports.AddressController = AddressController;
exports.addressController = new AddressController();
//# sourceMappingURL=address.controller.js.map