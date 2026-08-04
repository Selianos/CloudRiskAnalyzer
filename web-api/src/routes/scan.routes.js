import { Router } from 'express';
import {
  getScans,
  createScan,
  getScanById,
  getScanResults,
} from '../controllers/scan.controller.js';
import { authCheck } from '../middleware/auth.middleware.js';

const router = Router();

// Protected endpoints
router.get('/', authCheck, getScans);
router.post('/', authCheck, createScan);
router.get('/:scan_id', authCheck, getScanById);
router.get('/:scan_id/results', authCheck, getScanResults);

export default router;
