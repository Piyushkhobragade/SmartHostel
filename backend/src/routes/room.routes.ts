import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Room management
router.get('/', requireRole(['ADMIN']), getRooms);
router.post('/', requireRole(['ADMIN']), createRoom);
router.put('/:id', requireRole(['ADMIN']), updateRoom);
router.delete('/:id', requireRole(['ADMIN']), deleteRoom);

export default router;
