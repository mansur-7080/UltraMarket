"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const user_schemas_1 = require("../schemas/user.schemas");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'));
router.post('/users', (0, validation_middleware_1.validateBody)(user_schemas_1.adminCreateUserSchema), user_controller_1.userController.createUser);
router.get('/users', (0, validation_middleware_1.validateQuery)(user_schemas_1.getUsersQuerySchema), user_controller_1.userController.getUsers);
router.get('/users/stats', user_controller_1.userController.getUserStats);
router.get('/users/:userId', (0, validation_middleware_1.validateParams)(user_schemas_1.userIdParamSchema), user_controller_1.userController.getUserById);
router.put('/users/:userId', (0, validation_middleware_1.validateParams)(user_schemas_1.userIdParamSchema), (0, validation_middleware_1.validateBody)(user_schemas_1.adminUpdateUserSchema), user_controller_1.userController.updateUserById);
router.delete('/users/:userId', (0, validation_middleware_1.validateParams)(user_schemas_1.userIdParamSchema), user_controller_1.userController.deleteUserById);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map