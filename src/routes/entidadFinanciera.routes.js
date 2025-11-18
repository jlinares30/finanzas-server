import {Router } from 'express';
import { getAllEntidades, getEntidadById, createEntidad, updateEntidad, removeEntidad } from '../controllers/entidadFinanciera.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/:id', authMiddleware, getEntidadById);
router.put('/:id', authMiddleware, updateEntidad);
router.delete('/:id', authMiddleware, removeEntidad);
router.post('/', authMiddleware, createEntidad);
router.get('/', authMiddleware, getAllEntidades);

export default router;
