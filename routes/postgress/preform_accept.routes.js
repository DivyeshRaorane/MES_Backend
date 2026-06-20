import express from 'express';
import { preformAcceptanceController } from '../../controller/postgres/preform_accept/preform_accept.controller.js';

const router = express.Router();

router.post('/preformaccept',preformAcceptanceController);

export default router;
