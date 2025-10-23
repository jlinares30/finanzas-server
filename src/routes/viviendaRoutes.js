import {Router } from 'express';
import { createVivienda, getViviendas } from '../controllers/viviendaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createVivienda);
router.get('/', authMiddleware, getViviendas);

export default router;
