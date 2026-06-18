import { Router } from 'express';
import {
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    askQuestion,
    checkHealth,
    seedDocuments,
} from '../controllers/knowledge.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// Anyone authenticated can ask questions (students, staff, admin)
router.post('/ask', askQuestion);
router.get('/health', checkHealth);

// ADMIN only — document management
router.get('/', requireRole(['ADMIN']), getDocuments);
router.post('/', requireRole(['ADMIN']), createDocument);
router.put('/:id', requireRole(['ADMIN']), updateDocument);
router.delete('/:id', requireRole(['ADMIN']), deleteDocument);
router.post('/seed', requireRole(['ADMIN']), seedDocuments);

export default router;
