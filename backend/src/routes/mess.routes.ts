import express from 'express';
import { messSubscriptionController } from '../controllers/messSubscription.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// All mess subscription routes require ADMIN role
router.use(requireRole(['ADMIN']));

// GET /api/mess/subscriptions - List all subscriptions (with optional isActive filter)
router.get('/', messSubscriptionController.listMessSubscriptions);

// GET /api/mess/subscriptions/:id - Get a specific subscription
router.get('/:id', messSubscriptionController.getMessSubscription);

// POST /api/mess/subscriptions - Create a new subscription
router.post('/', messSubscriptionController.createMessSubscription);

// PUT /api/mess/subscriptions/:id - Update a subscription
router.put('/:id', messSubscriptionController.updateMessSubscription);

// PATCH /api/mess/subscriptions/:id/deactivate - Deactivate a subscription
router.patch('/:id/deactivate', messSubscriptionController.deactivateMessSubscription);

export default router;
