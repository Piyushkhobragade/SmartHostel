import { Router } from 'express';
import { getTimeline, getAlerts, updateAlert, runChecks } from '../controllers/intelligence.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

const adminStaff = requireRole(['ADMIN', 'STAFF']);
const adminOnly = requireRole(['ADMIN']);

// Timeline feed
router.get('/timeline', adminStaff, getTimeline);

// Risk Monitor / Alerts
router.get('/alerts', adminStaff, getAlerts);
router.patch('/alerts/:id', adminStaff, updateAlert);

// Manual intelligence trigger (admin only)
router.post('/intelligence/run', adminOnly, runChecks);

export default router;
