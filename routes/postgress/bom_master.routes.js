import express from 'express';
import { authMiddleware } from '../../middleware/aut_middleware.js';
import { getAllBomsC, getBomByMaterialCodeC, createBomC, updateBomC, toggleBomStatusC } from '../../controller/postgres/bom_master/bom_master.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getAllBomsC);
router.get('/:materialCode', authMiddleware, getBomByMaterialCodeC);
router.post('/', authMiddleware, createBomC);
router.put('/:materialCode', authMiddleware, updateBomC);
router.patch('/:materialCode/status', authMiddleware, toggleBomStatusC);

export default router;
