import {Router } from 'express';
import { getIndicadoresByPlan, calcularIndicadores } from '../controllers/indicadorFinanciero.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/:id', authMiddleware, getIndicadoresByPlan );
router.post('/:id', authMiddleware, calcularIndicadores );

export default router;
