import { Router } from 'express';
import { getMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest } from '../controllers/maintenance.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN and STAFF - Maintenance management
router.get('/', requireRole(['ADMIN', 'STAFF']), getMaintenanceRequests);
router.post('/', requireRole(['ADMIN', 'STAFF']), createMaintenanceRequest);
router.put('/:id', requireRole(['ADMIN', 'STAFF']), updateMaintenanceRequest);

export default router;
