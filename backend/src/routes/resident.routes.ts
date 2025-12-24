import { Router } from 'express';
import { getResidents, createResident } from '../controllers/resident.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Resident management
router.get('/', requireRole(['ADMIN']), getResidents);
router.post('/', requireRole(['ADMIN']), createResident);

export default router;
