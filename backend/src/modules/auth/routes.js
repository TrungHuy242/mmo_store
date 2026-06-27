import { Router } from 'express';
import controller from './controller.js';
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation, updateProfileValidation } from './validation.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerValidation, controller.register);
router.post('/login', loginValidation, controller.login);
router.post('/admin/login', loginValidation, controller.adminLogin);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', controller.logout);
router.post('/forgot-password', forgotPasswordValidation, controller.forgotPassword);
router.post('/reset-password', resetPasswordValidation, controller.resetPassword);
router.get('/verify-email/:userId/:token', controller.verifyEmail);

// 2FA OTP routes
router.post('/verify-otp', controller.verifyLoginOtp);
router.post('/resend-otp', controller.resendLoginOtp);

// Protected routes
router.get('/me', authenticate, controller.getProfile);
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, updateProfileValidation, controller.updateProfile);
router.post('/change-password', authenticate, changePasswordValidation, controller.changePassword);
router.post('/toggle-2fa', authenticate, controller.toggleTwoFactor);

export default router;
