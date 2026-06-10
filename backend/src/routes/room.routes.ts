import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createRoomSchema, updateRoomSchema } from '../lib/schemas';

const router = Router();

// ADMIN only - Room management
router.get('/', requireRole(['ADMIN']), getRooms);
router.post('/', requireRole(['ADMIN']), validate(createRoomSchema), createRoom);
router.put('/:id', requireRole(['ADMIN']), validate(updateRoomSchema), updateRoom);
router.delete('/:id', requireRole(['ADMIN']), deleteRoom);

export default router;
