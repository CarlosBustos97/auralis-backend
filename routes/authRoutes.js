import express from 'express';
import { login, register, me } from '../controllers/authController.js';
import authMiddleware from '../middleare/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, me);

export default router;
