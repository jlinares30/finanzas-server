import {Router } from 'express';
import { createSocioeconomico, createHogar, getCompleteProfile } from '../controllers/cliente.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/socioeconomico', createSocioeconomico);
router.post('/hogar', authMiddleware, createHogar);
router.get('/perfil', authMiddleware, getCompleteProfile);

export default router;
