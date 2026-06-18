import { Router } from 'express';
import { getMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest } from '../controllers/maintenance.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createMaintenanceSchema, updateMaintenanceSchema } from '../lib/schemas';

const router = Router();

// ADMIN and STAFF - Maintenance management
router.get('/', requireRole(['ADMIN', 'STAFF']), getMaintenanceRequests);
router.post('/', requireRole(['ADMIN', 'STAFF']), validate(createMaintenanceSchema), createMaintenanceRequest);
router.put('/:id', requireRole(['ADMIN', 'STAFF']), validate(updateMaintenanceSchema), updateMaintenanceRequest);

export default router;
