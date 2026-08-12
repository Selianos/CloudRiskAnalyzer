import express from 'express';
import { signup, register, login, logout, refresh, me } from '../controllers/auth.controller.js';
import { authCheck } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authCheck, logout);
router.post('/refresh', refresh);
router.get('/me', authCheck, me);

export default router;
