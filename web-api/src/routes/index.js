import express from 'express';
import authRoutes from './auth.routes.js';
import connectionRoutes from './connection.routes.js';
import scanRoutes from './scan.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/connections', connectionRoutes);
router.use('/scans', scanRoutes);

export default router;
