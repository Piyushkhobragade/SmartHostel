import { Router } from 'express';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../controllers/asset.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createAssetSchema, updateAssetSchema } from '../lib/schemas';

const router = Router();

// ADMIN only - Asset management
router.get('/', requireRole(['ADMIN']), getAssets);
router.post('/', requireRole(['ADMIN']), validate(createAssetSchema), createAsset);
router.put('/:id', requireRole(['ADMIN']), validate(updateAssetSchema), updateAsset);
router.delete('/:id', requireRole(['ADMIN']), deleteAsset);

export default router;
