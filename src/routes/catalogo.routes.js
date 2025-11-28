import { Router } from 'express';
import { getEntidadesFinancieras, getLocales, getLocalById, createLocal, updateLocal } from '../controllers/catalogo.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/entidades-financieras', authMiddleware, getEntidadesFinancieras);
router.get('/locales', authMiddleware, getLocales);
router.post('/locales', authMiddleware, createLocal);
router.get('/locales/:id', authMiddleware, getLocalById);
router.put('/locales/:id', authMiddleware, updateLocal);

export default router;
