import {Router } from 'express';
import { createPlanPago, getPlanPagos } from '../controllers/planPagosController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createPlanPago);
router.get('/', authMiddleware, getPlanPagos);

export default router;
