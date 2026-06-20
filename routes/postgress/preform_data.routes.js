import express from 'express';
import { syncNow,createPreform,getPreform } from "../../controller/postgres/preform_data/preform_data.controller.js";

const router = express.Router();

router.post('/syncpreform',syncNow);
router.post('/createpreform', createPreform)
router.get('/getpreform',getPreform)

export default router;