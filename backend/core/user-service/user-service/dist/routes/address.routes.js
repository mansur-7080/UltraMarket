"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const address_controller_1 = require("../controllers/address.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const user_schemas_1 = require("../schemas/user.schemas");
const router = (0, express_1.Router)();
router.get('/user/:userId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeSelfOrAdmin)(), (0, validation_middleware_1.validateParams)(user_schemas_1.userIdParamSchema), (0, validation_middleware_1.validateQuery)(user_schemas_1.getAddressesQuerySchema), address_controller_1.addressController.getUserAddresses);
router.post('/user/:userId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeSelfOrAdmin)(), (0, validation_middleware_1.validateParams)(user_schemas_1.userIdParamSchema), (0, validation_middleware_1.validateBody)(user_schemas_1.createAddressSchema), address_controller_1.addressController.createAddress);
router.get('/user/:userId/address/:addressId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeSelfOrAdmin)(), (0, validation_middleware_1.validateParams)(user_schemas_1.userIdAndAddressIdParamSchema), address_controller_1.addressController.getAddressById);
router.put('/user/:userId/address/:addressId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeSelfOrAdmin)(), (0, validation_middleware_1.validateParams)(user_schemas_1.userIdAndAddressIdParamSchema), (0, validation_middleware_1.validateBody)(user_schemas_1.updateAddressSchema), address_controller_1.addressController.updateAddress);
router.delete('/user/:userId/address/:addressId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeSelfOrAdmin)(), (0, validation_middleware_1.validateParams)(user_schemas_1.userIdAndAddressIdParamSchema), address_controller_1.addressController.deleteAddress);
router.put('/user/:userId/address/:addressId/default', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeSelfOrAdmin)(), (0, validation_middleware_1.validateParams)(user_schemas_1.userIdAndAddressIdParamSchema), address_controller_1.addressController.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=address.routes.js.map