import {Router } from 'express';
import { getEntidadesFinancieras, getLocales, getLocalById, createLocal } from '../controllers/catalogo.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/entidades-financieras', authMiddleware, getEntidadesFinancieras);
router.get('/locales', authMiddleware, getLocales);
router.post('/locales', authMiddleware, createLocal);
router.get('/locales/:id', authMiddleware, getLocalById);

export default router;
