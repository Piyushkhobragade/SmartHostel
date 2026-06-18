import { Router } from 'express';
import { getAttendance, markAttendance } from '../controllers/attendance.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { markAttendanceSchema } from '../lib/schemas';

const router = Router();

// ADMIN and STAFF - Attendance management
router.get('/', requireRole(['ADMIN', 'STAFF']), getAttendance);
router.post('/', requireRole(['ADMIN', 'STAFF']), validate(markAttendanceSchema), markAttendance);

export default router;
