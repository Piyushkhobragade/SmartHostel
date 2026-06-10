import { Router } from 'express';
import { getVisitors, createVisitor, checkoutVisitor } from '../controllers/visitor.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createVisitorSchema } from '../lib/schemas';

const router = Router();

// ADMIN and STAFF - Visitor management
router.get('/', requireRole(['ADMIN', 'STAFF']), getVisitors);
router.post('/', requireRole(['ADMIN', 'STAFF']), validate(createVisitorSchema), createVisitor);
router.post('/:id/checkout', requireRole(['ADMIN', 'STAFF']), checkoutVisitor);

export default router;
