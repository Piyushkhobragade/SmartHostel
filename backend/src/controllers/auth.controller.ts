import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Login Controller
 * 
 * Authenticates user with username and password
 * Returns JWT token and user info on success
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        // IMPORTANT: JWT_SECRET must be set in environment variables
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        // Return token and user info (excluding password hash)
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

/**
 * Change Password Controller
 * 
 * Allows authenticated users to change their password
 * Requires old password verification
 * 
 * @route POST /api/auth/change-password
 * @access Private (requires JWT)
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id; // From JWT middleware
        const { oldPassword, newPassword } = req.body;

        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: 'Old password and new password are required'
            });
        }

        // Password strength validation
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash }
        });

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Failed to change password' });
    }
};

/**
 * Forgot Password Controller
 * 
 * Resets user password using a master reset code
 * For demo/educational purposes only - not production-ready
 * 
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { username, resetCode, newPassword } = req.body;

        // Validate input
        if (!username || !resetCode || !newPassword) {
            return res.status(400).json({
                message: 'Username, reset code, and new password are required'
            });
        }

        // Password strength validation
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long'
            });
        }

        // Verify reset code against environment variable
        const masterCode = process.env.RESET_MASTER_CODE || 'HOSTEL2024';
        if (resetCode !== masterCode) {
            return res.status(401).json({
                message: 'Invalid reset code'
            });
        }

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash }
        });

        res.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
};
