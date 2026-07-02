import express from 'express';
import { getPreformForAllocationC, preformAllocationEntryC , recentAllocatedPreformsC, preformsByTowersC, preformDeallocationC} from '../../controller/postgres/preform_allocation/preform_allocation.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/getpreformforallocation',getPreformForAllocationC);
router.post('/preformallocationentry',authMiddleware,preformAllocationEntryC)
router.put('/preformdeallocation/:allocation_id', preformDeallocationC)
router.get('/recentallocatedpreform', recentAllocatedPreformsC)
router.get('/preformbytower/:tower_id',preformsByTowersC )

export default router;