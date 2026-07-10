import express from 'express';
import { getAllCustomersC, createCustomerC, updateCustomerC } from '../../controller/postgres/admin/customer_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/customers', getAllCustomersC);
router.post('/admin/customers', authMiddleware, createCustomerC);
router.put('/admin/customers/:customer_id', authMiddleware, updateCustomerC);

export default router;
