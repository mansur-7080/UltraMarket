"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const common_1 = require("@ultramarket/common");
const common_2 = require("@ultramarket/common");
const userRepository_1 = require("../repositories/userRepository");
const crypto_1 = require("crypto");
const shared_1 = require("@ultramarket/shared");
const nodemailer_1 = __importDefault(require("nodemailer"));
class UserService {
    emailTransporter;
    constructor() {
        this.initializeEmailService();
    }
    initializeEmailService() {
        const emailConfig = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || '',
            },
        };
        this.emailTransporter = nodemailer_1.default.createTransporter(emailConfig);
    }
    async sendEmail(to, subject, html, text) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@ultramarket.com',
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, ''),
            };
            const info = await this.emailTransporter.sendMail(mailOptions);
            shared_1.logger.info('Email sent successfully', {
                messageId: info.messageId,
                to,
                subject,
                operation: 'email_sent',
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to send email', {
                to,
                subject,
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'email_send_failed',
            });
            throw error;
        }
    }
    generateEmailVerificationTemplate(userName, verificationUrl) {
        return {
            subject: 'UltraMarket - Email tasdiqlash',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">UltraMarket</h2>
          <h3>Salom ${userName}!</h3>
          <p>UltraMarket platformasiga xush kelibsiz!</p>
          <p>Email manzilingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #1890ff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Email tasdiqlash
            </a>
          </div>
          <p>Bu havola 24 soat amal qiladi.</p>
          <p>Agar siz bu xabar yuborishni so'ramagansiz, uni e'tiborsiz qoldiring.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Bu xabar UltraMarket platformasi tomonidan avtomatik yuborilgan.
          </p>
        </div>
      `,
            text: `
        UltraMarket - Email tasdiqlash
        
        Salom ${userName}!
        
        UltraMarket platformasiga xush kelibsiz!
        Email manzilingizni tasdiqlash uchun quyidagi havolani oching:
        
        ${verificationUrl}
        
        Bu havola 24 soat amal qiladi.
        
        Agar siz bu xabar yuborishni so'ramagansiz, uni e'tiborsiz qoldiring.
      `,
        };
    }
    generatePasswordResetTemplate(userName, resetUrl) {
        return {
            subject: 'UltraMarket - Parolni tiklash',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">UltraMarket</h2>
          <h3>Salom ${userName}!</h3>
          <p>Parolingizni tiklash so'rovi qabul qilindi.</p>
          <p>Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1890ff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Parolni tiklash
            </a>
          </div>
          <p>Bu havola 1 soat amal qiladi.</p>
          <p>Agar siz parolni tiklashni so'ramagansiz, uni e'tiborsiz qoldiring.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Bu xabar UltraMarket platformasi tomonidan avtomatik yuborilgan.
          </p>
        </div>
      `,
            text: `
        UltraMarket - Parolni tiklash
        
        Salom ${userName}!
        
        Parolingizni tiklash so'rovi qabul qilindi.
        Yangi parol o'rnatish uchun quyidagi havolani oching:
        
        ${resetUrl}
        
        Bu havola 1 soat amal qiladi.
        
        Agar siz parolni tiklashni so'ramagansiz, uni e'tiborsiz qoldiring.
      `,
        };
    }
    async registerUser(userData) {
        const existingUser = await userRepository_1.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new common_2.ConflictError('User with this email already exists');
        }
        const hashedPassword = await (0, common_1.hashPassword)(userData.password);
        const createdUser = await userRepository_1.userRepository.create({
            ...userData,
            passwordHash: hashedPassword,
        });
        const verificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
        await common_1.cache.setex(`email_verify:${verificationToken}`, 24 * 60 * 60, createdUser.id);
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const emailTemplate = this.generateEmailVerificationTemplate(createdUser.firstName, verificationUrl);
        await this.sendEmail(createdUser.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
        shared_1.logger.info('Email verification sent', {
            userId: createdUser.id,
            email: createdUser.email,
            operation: 'email_verification_sent',
        });
        const tokens = await (0, common_1.generateTokens)({
            userId: createdUser.id,
            email: createdUser.email,
            role: createdUser.role,
        });
        const { passwordHash, ...userWithoutPassword } = createdUser;
        return {
            user: userWithoutPassword,
            tokens,
        };
    }
    async loginUser(email, password, req) {
        const user = await userRepository_1.userRepository.findByEmail(email);
        if (!user) {
            throw new common_2.UnauthorizedError('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_2.UnauthorizedError('Account is deactivated');
        }
        const isPasswordValid = await (0, common_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_2.UnauthorizedError('Invalid credentials');
        }
        await userRepository_1.userRepository.updateLastLogin(user.id);
        if (req) {
            await (0, common_1.createSession)(user.id, { userAgent: String(req.headers['user-agent'] || 'Unknown') }, req.ip || '');
        }
        const tokens = await (0, common_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const { passwordHash: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens,
        };
    }
    async getUserById(userId) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new common_2.NotFoundError('User not found');
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateUser(userId, updateData) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new common_2.NotFoundError('User not found');
        }
        const updatedUser = await userRepository_1.userRepository.update(userId, updateData);
        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async deleteUser(userId) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new common_2.NotFoundError('User not found');
        }
        await userRepository_1.userRepository.delete(userId);
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = (0, common_1.verifyRefreshToken)(refreshToken);
            const user = await userRepository_1.userRepository.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw new common_2.UnauthorizedError('Invalid refresh token');
            }
            const tokens = await (0, common_1.generateTokens)({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            return tokens;
        }
        catch (error) {
            throw new common_2.UnauthorizedError('Invalid refresh token');
        }
    }
    async logoutUser(userId, accessToken, sessionId) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new common_2.NotFoundError('User not found');
        }
        if (accessToken) {
            await common_1.cache.setex(`blacklist:${accessToken}`, 15 * 60, '1');
        }
        if (sessionId) {
            await common_1.cache.del(`session:${sessionId}`);
            await common_1.cache.srem(`user_sessions:${userId}`, sessionId);
        }
    }
    async verifyEmail(token) {
        const userId = await common_1.cache.get(`email_verify:${token}`);
        if (!userId) {
            throw new common_2.UnauthorizedError('Invalid or expired verification token');
        }
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new common_2.NotFoundError('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_2.ConflictError('Email already verified');
        }
        await userRepository_1.userRepository.update(userId, { isEmailVerified: true });
        await common_1.cache.del(`email_verify:${token}`);
        return true;
    }
    async forgotPassword(email) {
        const user = await userRepository_1.userRepository.findByEmail(email);
        if (!user) {
            return;
        }
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        await common_1.cache.setex(`reset_password:${resetToken}`, 60 * 60, user.id);
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const emailTemplate = this.generatePasswordResetTemplate(user.firstName, resetUrl);
        await this.sendEmail(user.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
        shared_1.logger.info('Password reset email sent', {
            userId: user.id,
            email: user.email,
            operation: 'password_reset_sent',
        });
    }
    async resetPassword(token, newPassword) {
        const userId = await common_1.cache.get(`reset_password:${token}`);
        if (!userId) {
            throw new common_2.UnauthorizedError('Invalid or expired reset token');
        }
        const hashedPassword = await (0, common_1.hashPassword)(newPassword);
        await userRepository_1.userRepository.update(userId, { passwordHash: hashedPassword });
        await common_1.cache.del(`reset_password:${token}`);
        return true;
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=userService.js.map