import { Router } from 'express';
import { getResidents, createResident, updateResident, deleteResident } from '../controllers/resident.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Resident management
router.get('/', requireRole(['ADMIN']), getResidents);
router.post('/', requireRole(['ADMIN']), createResident);
router.put('/:id', requireRole(['ADMIN']), updateResident);
router.delete('/:id', requireRole(['ADMIN']), deleteResident);

export default router;
