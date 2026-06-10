import { Router } from 'express';
import {
    getStudentDashboard,
    getStudentRoom,
    getStudentAttendance,
    getStudentFees,
    getStudentVisitors,
    createStudentVisitor,
    createStudentMaintenance,
    askStudentAI,
} from '../controllers/student.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require STUDENT role. residentId is auto-scoped from JWT.
router.get('/dashboard', requireRole(['STUDENT']), getStudentDashboard);
router.get('/room', requireRole(['STUDENT']), getStudentRoom);
router.get('/attendance', requireRole(['STUDENT']), getStudentAttendance);
router.get('/fees', requireRole(['STUDENT']), getStudentFees);
router.get('/visitors', requireRole(['STUDENT']), getStudentVisitors);
router.post('/visitors', requireRole(['STUDENT']), createStudentVisitor);
router.post('/maintenance', requireRole(['STUDENT']), createStudentMaintenance);

/**
 * POST /api/student/ask
 * Student AI — answers questions grounded in the student's own data + knowledge corpus.
 * STUDENT role only. residentId is derived exclusively from the JWT in the controller.
 */
router.post('/ask', requireRole(['STUDENT']), askStudentAI);

export default router;
