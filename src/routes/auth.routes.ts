import { Router } from 'express';
import { login, changePassword, forgotPassword } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/login - User login
router.post('/login', login);

// POST /api/auth/change-password - Change password (requires authentication)
router.post('/change-password', verifyToken, changePassword);

// POST /api/auth/forgot-password - Reset password with reset code
router.post('/forgot-password', forgotPassword);

export default router;
