import { Router } from 'express';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../controllers/asset.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// ADMIN only - Asset management
router.get('/', requireRole(['ADMIN']), getAssets);
router.post('/', requireRole(['ADMIN']), createAsset);
router.put('/:id', requireRole(['ADMIN']), updateAsset);
router.delete('/:id', requireRole(['ADMIN']), deleteAsset);

export default router;
