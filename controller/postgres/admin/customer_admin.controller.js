import { getAllCustomersS, createCustomerS, updateCustomerS } from "../../../services/admin/customer_admin.service.js";

export const getAllCustomersC = async (req, res) => {
    try {
        const result = await getAllCustomersS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCustomerC = async (req, res) => {
    try {
        const { customer_name } = req.body;
        if (!customer_name) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }
        const result = await createCustomerS(req.body);
        res.status(201).json({ success: true, data: result, message: 'Customer created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomerC = async (req, res) => {
    try {
        const { customer_id } = req.params;
        const { customer_name } = req.body;

        if (!customer_name) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }

        const result = await updateCustomerS(customer_id, req.body);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, data: result, message: 'Customer updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
