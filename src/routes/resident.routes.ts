import { Router } from 'express';
import { getResidents, createResident, updateResident, deleteResident } from '../controllers/resident.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createResidentSchema, updateResidentSchema } from '../lib/schemas';

const router = Router();

// ADMIN only - Resident management
router.get('/', requireRole(['ADMIN']), getResidents);
router.post('/', requireRole(['ADMIN']), validate(createResidentSchema), createResident);
router.put('/:id', requireRole(['ADMIN']), validate(updateResidentSchema), updateResident);
router.delete('/:id', requireRole(['ADMIN']), deleteResident);

export default router;
