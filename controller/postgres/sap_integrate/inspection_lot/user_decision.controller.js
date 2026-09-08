import { getPendingUserDecisionsS } from "../../../../services/sap_integrate/inspection_lot/user_decision.service.js";

/**
 * GET /api/user-decision/pending
 *
 * Return all bobbins awaiting a user decision — order_conf rows with a non-null
 * inspection_lot whose usage decision has not been made (ud = false), enriched
 * from bobbin_entries with optical_length, final_grade and product_type.
 *
 * Optional query filters:
 *   - bobbin_no       partial, case-insensitive match
 *   - inspection_lot  exact match
 *
 * Response envelope:
 *   { success: true, message: "...", data: [ ... ] }
 */
export const getPendingUserDecisionsC = async (req, res) => {
    try {
        const { bobbin_no, inspection_lot } = req.query;

        const data = await getPendingUserDecisionsS({ bobbin_no, inspection_lot });

        return res.status(200).json({
            success: true,
            message: "Pending user decisions fetched",
            data,
        });
    } catch (error) {
        console.error("[User Decision Pending] error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
