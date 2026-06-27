import express from 'express';
import { preformAcceptanceController } from '../../controller/postgres/preform_accept/preform_accept.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post('/preformaccept',authMiddleware,preformAcceptanceController);

export default router;
