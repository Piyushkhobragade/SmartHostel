import { Router } from 'express';

import {
    getOccupancyData,
    getOccupancyForecast
} from '../controllers/analytics.controller';

import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Analytics
router.get(
    '/occupancy',
    requireRole(['ADMIN']),
    getOccupancyData
);

router.get(
    '/forecast',
    requireRole(['ADMIN']),
    getOccupancyForecast
);

export default router;
