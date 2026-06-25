import express from 'express';
import { getPreformForAllocationC, preformAllocationEntryC , recentAllocatedPreformsC, preformsByTowersC} from '../../controller/postgres/preform_allocation/preform_allocation.controller.js';

const router = express.Router();

router.get('/getpreformforallocation',getPreformForAllocationC);
router.post('/preformallocationentry',preformAllocationEntryC)
router.get('/recentallocatedpreform', recentAllocatedPreformsC)
router.get('/preformbytower/:tower_id',preformsByTowersC )

export default router;