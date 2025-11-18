import {Router } from 'express';
import { getEntidadesFinancieras, getLocales, getLocalById } from '../controllers/catalogo.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/entidades-financieras', authMiddleware, getEntidadesFinancieras);
router.get('/locales', authMiddleware, getLocales);
router.get('/locales/:id', authMiddleware, getLocalById);

export default router;
