import { Router } from 'express';
import { getInvoices, createInvoice, createPayment } from '../controllers/fee.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, createPaymentSchema } from '../lib/schemas';

const router = Router();

// ADMIN only - Fee management
// Invoice routes
router.get('/invoices', requireRole(['ADMIN']), getInvoices);
router.post('/invoices', requireRole(['ADMIN']), validate(createInvoiceSchema), createInvoice);

// Payment routes
router.post('/payments', requireRole(['ADMIN']), validate(createPaymentSchema), createPayment);

export default router;
