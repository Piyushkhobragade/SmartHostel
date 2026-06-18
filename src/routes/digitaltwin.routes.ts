import { Router } from 'express';
import { getOverview, getHeatmap, getRoomProfile } from '../controllers/digitaltwin.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

const adminStaff = requireRole(['ADMIN', 'STAFF']);

router.get('/overview', adminStaff, getOverview);
router.get('/heatmap/:type', adminStaff, getHeatmap);
router.get('/room/:id', adminStaff, getRoomProfile);

export default router;
