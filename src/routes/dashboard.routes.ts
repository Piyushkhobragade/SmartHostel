import { Router } from 'express';
import { getDashboard, getIntelligence } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', getDashboard);
router.get('/intelligence', getIntelligence);

export default router;
