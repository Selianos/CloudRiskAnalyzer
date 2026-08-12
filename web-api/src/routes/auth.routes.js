import express from 'express';
import { signup, login, logout, refresh, me, changePassword, changeName } from '../controllers/auth.controller.js';
import { authCheck } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authCheck, logout);
router.post('/refresh', refresh);
router.get('/me', authCheck, me);

router.put('/password', authCheck, changePassword);
router.put('/name', authCheck, changeName);

export default router;
