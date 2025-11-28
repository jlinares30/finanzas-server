import { Router } from 'express';
import { generarPlanPago, getPlanesPagosByUser, getPlanPagoById, eliminarPlanPago, obtenerCuotasPorPlan } from '../controllers/planPagos.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, generarPlanPago);
router.get('/user/:userId', authMiddleware, getPlanesPagosByUser);
router.get('/:id', authMiddleware, getPlanPagoById);
router.delete('/:id', authMiddleware, eliminarPlanPago);
router.get('/:id/cuotas', authMiddleware, obtenerCuotasPorPlan);

export default router;
