import { Router } from 'express';
import { getOccupancyData, getFeesData, getForecast } from '../controllers/analytics.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Analytics
router.get('/occupancy', requireRole(['ADMIN']), getOccupancyData);
router.get('/fees', requireRole(['ADMIN']), getFeesData);
router.get('/forecast', requireRole(['ADMIN']), getForecast);

export default router;
