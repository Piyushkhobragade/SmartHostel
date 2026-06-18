import { Router } from 'express';
import multer from 'multer';
import { createDraft, updateDraft, getDrafts, completeAdmission, processBulkAdmission, uploadDocument } from '../controllers/admission.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createDraftSchema, updateDraftSchema, completeAdmissionSchema } from '../lib/schemas/admission.schema';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// All admission routes require ADMIN role
router.use(requireRole(['ADMIN']));

// Draft Management
router.post('/drafts', validate(createDraftSchema), createDraft);
router.put('/drafts/:id', validate(updateDraftSchema), updateDraft);
router.get('/drafts', getDrafts);

// Document Upload
router.post('/documents/upload', upload.single('document'), uploadDocument);

// Completion and Bulk Processing
router.post('/complete', validate(completeAdmissionSchema), completeAdmission);
router.post('/bulk', processBulkAdmission);

export default router;
