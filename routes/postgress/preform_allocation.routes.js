import express from 'express';
import { getPreformForAllocationC, preformAllocationEntryC , recentAllocatedPreformsC} from '../../controller/postgres/preform_allocation/preform_allocation.controller.js';

const router = express.Router();

router.get('/getpreformforallocation',getPreformForAllocationC);
router.post('/preformallocationentry',preformAllocationEntryC)
router.get('/recentallocatedpreform', recentAllocatedPreformsC)

export default router;