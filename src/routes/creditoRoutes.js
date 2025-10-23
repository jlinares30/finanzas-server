import {Router } from 'express';
import { createCredito, getCreditos } from '../controllers/creditoController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createCredito);
router.get('/', authMiddleware, getCreditos);

export default router;
