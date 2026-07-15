import express from 'express';
import { getSpecListC, getSpecByIdC, createSpecC, updateSpecC, deactivateSpecC } from '../../controller/postgres/spec/spec.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/spec', authMiddleware, getSpecListC);
router.get('/spec/:id', authMiddleware, getSpecByIdC);
router.post('/spec', authMiddleware, createSpecC);
router.put('/spec/:id', authMiddleware, updateSpecC);
router.patch('/spec/:id/deactivate', authMiddleware, deactivateSpecC);

export default router;
