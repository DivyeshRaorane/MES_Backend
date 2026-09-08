import { getMaterialsForDropdownS } from "../../../services/admin_order/admin_materials.service.js";

// GET /api/admin/materials?category=...
export const getMaterialsForDropdownC = async (req, res) => {
    try {
        const data = await getMaterialsForDropdownS(req.query.category);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
