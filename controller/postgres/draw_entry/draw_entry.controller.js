import { drawEntryS, getDrawEntryDataForPTAS } from "../../../services/draw_entry/draw_entry.service.js";
import pool from "../../../db/postgres.js";

export const drawEntryC = async(req,res)=>{
    try{
        const payload = req.body;
        const emp_id = req.user.emp_id;

        const { handle_active, preform_end, preform_remove, tower_no, preform_id, spool_id } = payload;

        // Scenario: Mark Preform End (button click) — no draw entry, just tower free + balance update
        if (handle_active && preform_end && !spool_id) {
            // 1. Set mat_stock balance to 0
            await pool.query(
                `UPDATE mat_stock SET balance_qty = 0 WHERE batch_id = $1`,
                [preform_id]
            );

            // 2. Free the tower
            await pool.query(
                `UPDATE draw_tower SET is_active = true WHERE tower_no = $1`,
                [tower_no]
            );

            // 3. Mark preform allocation as complete
            await pool.query(
                `UPDATE preform_allocation SET preform_draw = true WHERE preform_id = $1`,
                [preform_id]
            );

            // 4. Free handle_join allocation
            await pool.query(
                `UPDATE handle_join SET is_allocate = FALSE WHERE preform_id = $1`,
                [preform_id]
            );

            return res.status(200).json({ success: true, message: "Preform End marked. Tower freed." });
        }

        // Scenario: Preform Remove (button click) — no draw entry, just tower free
        if (handle_active && preform_remove && !spool_id) {
            // 1. Free the tower (do NOT set balance to 0, preform can be re-allocated)
            await pool.query(
                `UPDATE draw_tower SET is_active = true WHERE tower_no = $1`,
                [tower_no]
            );

            // 2. Free handle_join allocation
            await pool.query(
                `UPDATE handle_join SET is_allocate = FALSE WHERE preform_id = $1`,
                [preform_id]
            );

            return res.status(200).json({ success: true, message: "Preform removed. Tower freed." });
        }

        // Normal draw entry insert flow
        const result = await drawEntryS({...payload, logged_in_user:emp_id});

        return res.status(200).json({
            success:true,
            message:result.message,
            data:result
        });
    }catch(error){
        console.error("Draw Entry Error:",error);

        return res.status(500).json({
      success: false,
      message: error.message || "Failed to create draw entry"
    });
    }
}



export const getDrawEntryDataForPTAC = async (req, res) => {
    try {
        const { spool_id } = req.query;

        if (!spool_id) {
            return res.status(400).json({
                success: false,
                message: "spool_id is required"
            });
        }

        const data = await getDrawEntryDataForPTAS({ spool_id });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No draw entry found for this spool_id"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Draw entry data fetched successfully",
            data
        });

    } catch (error) {
        console.error("Get Draw Entry PTA Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

