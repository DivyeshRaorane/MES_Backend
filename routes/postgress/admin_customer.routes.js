import express from 'express';
import { getAllCustomersC, createCustomerC, updateCustomerC } from '../../controller/postgres/admin/customer_admin.controller.js';

const router = express.Router();

router.get('/admin/customers', getAllCustomersC);
router.post('/admin/customers', createCustomerC);
router.put('/admin/customers/:customer_id', updateCustomerC);

export default router;
