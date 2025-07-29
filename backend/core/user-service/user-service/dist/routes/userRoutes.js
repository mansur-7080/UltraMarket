"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const userValidators_1 = require("../validators/userValidators");
const shared_1 = require("@ultramarket/shared");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_1.validateRequest)(userValidators_1.registerSchema), userController_1.userController.register);
router.post('/login', (0, validation_1.validateRequest)(userValidators_1.loginSchema), userController_1.userController.login);
router.post('/refresh-token', (0, validation_1.validateRequest)(userValidators_1.refreshTokenSchema), userController_1.userController.refreshToken);
router.post('/forgot-password', (0, validation_1.validateRequest)(userValidators_1.forgotPasswordSchema), userController_1.userController.forgotPassword);
router.post('/reset-password', (0, validation_1.validateRequest)(userValidators_1.resetPasswordSchema), userController_1.userController.resetPassword);
router.get('/verify-email/:token', userController_1.userController.verifyEmail);
router.use(auth_1.authenticate);
router.get('/profile', userController_1.userController.getProfile);
router.put('/profile', (0, validation_1.validateRequest)(userValidators_1.updateProfileSchema), userController_1.userController.updateProfile);
router.delete('/account', userController_1.userController.deleteAccount);
router.post('/logout', userController_1.userController.logout);
router.get('/admin/users', (0, auth_1.authorize)(shared_1.UserRole.ADMIN, shared_1.UserRole.SUPER_ADMIN), async (_req, res) => {
    res.json({ message: 'Admin users list - not implemented yet' });
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map