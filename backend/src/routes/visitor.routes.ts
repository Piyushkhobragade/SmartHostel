import { Router } from 'express';
import { getVisitors, createVisitor, checkoutVisitor } from '../controllers/visitor.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN and STAFF - Visitor management
router.get('/', requireRole(['ADMIN', 'STAFF']), getVisitors);
router.post('/', requireRole(['ADMIN', 'STAFF']), createVisitor);
router.post('/:id/checkout', requireRole(['ADMIN', 'STAFF']), checkoutVisitor);

export default router;
