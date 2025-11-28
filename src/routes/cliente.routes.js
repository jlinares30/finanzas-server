import { Router } from 'express';
import { createSocioeconomico, getCompleteProfile, updateProfile, updateSocioeconomico } from '../controllers/cliente.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/socioeconomico', createSocioeconomico);
router.get('/profile/:userId', authMiddleware, getCompleteProfile);
router.put('/profile/:userId', authMiddleware, updateProfile);
router.put('/socioeconomico/:userId', authMiddleware, updateSocioeconomico);


export default router;
