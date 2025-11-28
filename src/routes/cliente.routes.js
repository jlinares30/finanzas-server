import { Router } from 'express';
import { createSocioeconomico, createHogar, getCompleteProfile, updateProfile, updateSocioeconomico } from '../controllers/cliente.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/socioeconomico', createSocioeconomico);
router.post('/house', authMiddleware, createHogar);
router.get('/profile/:userId', authMiddleware, getCompleteProfile);
router.put('/profile/:userId', authMiddleware, updateProfile);
router.put('/socioeconomico/:userId', authMiddleware, updateSocioeconomico);


export default router;
