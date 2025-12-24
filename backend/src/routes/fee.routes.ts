import { Router } from 'express';
import { getInvoices, createInvoice, createPayment } from '../controllers/fee.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Fee management
// Invoice routes
router.get('/invoices', requireRole(['ADMIN']), getInvoices);
router.post('/invoices', requireRole(['ADMIN']), createInvoice);

// Payment routes
router.post('/payments', requireRole(['ADMIN']), createPayment);

export default router;
