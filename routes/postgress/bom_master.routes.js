import express from 'express';
import { getAllBomsC, getBomByMaterialCodeC, createBomC, updateBomC, toggleBomStatusC } from '../../controller/postgres/bom_master/bom_master.controller.js';

const router = express.Router();

router.get('/', getAllBomsC);
router.get('/:materialCode', getBomByMaterialCodeC);
router.post('/', createBomC);
router.put('/:materialCode', updateBomC);
router.patch('/:materialCode/status', toggleBomStatusC);

export default router;
