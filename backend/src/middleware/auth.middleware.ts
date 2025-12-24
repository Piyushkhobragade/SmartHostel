import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Request interface to include user information
 * After authentication, user details are attached to req.user
 */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: string;
    };
}

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to request object
 * 
 * Usage: app.get('/protected-route', verifyToken, handler)
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header (format: "Bearer <token>")
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        ) as { id: string; username: string; role: string };

        // Attach user info to request
        req.user = decoded;
        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Failed to authenticate token' });
    }
};

/**
 * Role-Based Access Control Middleware
 * 
 * Checks if authenticated user has ADMIN role
 * Must be used after verifyToken middleware
 * 
 * Usage: app.get('/admin-route', verifyToken, requireAdmin, handler)
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

/**
 * Optional: Middleware to check for specific roles
 * 
 * Usage: app.get('/route', verifyToken, requireRole(['ADMIN', 'WARDEN']), handler)
 */
export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
        }

        next();
    };
};
