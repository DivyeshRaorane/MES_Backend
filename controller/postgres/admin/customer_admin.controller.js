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
        const result = await createCustomerS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomerC = async (req, res) => {
    try {
        const { customer_id } = req.params;
        const result = await updateCustomerS(customer_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
