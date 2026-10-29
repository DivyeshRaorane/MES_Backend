import express from 'express';
import { getSpecListC, getSpecByIdC, createSpecC, updateSpecC, deactivateSpecC } from '../../controller/postgres/spec/spec.controller.js';

const router = express.Router();

router.get('/spec', getSpecListC);
router.get('/spec/:id', getSpecByIdC);
router.post('/spec', createSpecC);
router.put('/spec/:id', updateSpecC);
router.patch('/spec/:id/deactivate', deactivateSpecC);

export default router;
