import { Router } from 'express';
import { getAttendance, markAttendance } from '../controllers/attendance.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN and STAFF - Attendance management
router.get('/', requireRole(['ADMIN', 'STAFF']), getAttendance);
router.post('/', requireRole(['ADMIN', 'STAFF']), markAttendance);

export default router;
