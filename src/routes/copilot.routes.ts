import { Router } from 'express';
import { chat, getConversations, getConversation, deleteConversation, getBriefing } from '../controllers/copilot.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN and STAFF only — operational AI
const wardRole = requireRole(['ADMIN', 'STAFF']);

router.post('/chat', wardRole, chat);
router.get('/briefing', wardRole, getBriefing);
router.get('/conversations', wardRole, getConversations);
router.get('/conversations/:id', wardRole, getConversation);
router.delete('/conversations/:id', wardRole, deleteConversation);

export default router;
