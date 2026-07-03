import { getBobbinForPvS, pvEntryS } from "../../../services/pv_entry/pv_entry.service.js";

export const getBobbinForPvC = async (req, res) => {
    try {
        const { bobbin_id } = req.params;

        const data = await getBobbinForPvS(bobbin_id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const pvEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await pvEntryS({ ...req.body, logged_in_user: emp_id });

        res.status(201).json(result);
    } catch (error) {
        console.error("PV Entry Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
