import {Router } from 'express';
import { generarPlanPago } from '../controllers/planPagos.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, generarPlanPago);

export default router;
