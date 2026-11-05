import express from 'express';
import { getAllCustomersC, createCustomerC, updateCustomerC } from '../../controller/postgres/admin/customer_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/customers', getAllCustomersC);
router.post('/admin/customers', requireRole("admin"), createCustomerC);
router.put('/admin/customers/:customer_id', requireRole("admin"), updateCustomerC);

export default router;
