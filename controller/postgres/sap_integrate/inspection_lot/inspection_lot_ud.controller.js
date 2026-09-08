import {
    postInspectionLotUd,
    postInspectionLotUdBulk,
} from "../../../../services/sap_integrate/inspection_lot/inspection_lot_ud.service.js";

/**
 * POST /api/sap/inspection-lot/ud
 *
 * Post a Usage Decision (UD) against an inspection lot in SAP.
 *
 * Accepts either a single entry or an array of entries in the request body,
 * so the frontend can use the same endpoint for single or bulk submissions.
 *
 * UD_CODE is OPTIONAL per entry. When omitted, the backend derives it
 * category-wise from the bobbin's final_grade (REW -> A2, FAIL -> R3,
 * else A1) using the centralized ud_code.js mapping. A caller-supplied
 * UD_CODE always takes precedence.
 *
 * IMPORTANT: one inspection lot can cover many bobbins with DIFFERENT grades.
 * So each entry should identify its bobbin (bobbin_no) or carry final_grade,
 * making the code unambiguous. A lot-only entry is resolved only when that lot
 * maps to a single grade; if it spans multiple grades the entry is rejected.
 *
 *   Preferred (per bobbin — always unambiguous):
 *     [
 *       { "InspectionLot": "40000000737", "bobbin_no": "B123", "type": "FTUD" },
 *       { "InspectionLot": "40000000737", "bobbin_no": "B124", "type": "FTUD" }
 *     ]
 *
 *   Also valid (send the grade directly, or force a code):
 *     { "InspectionLot": "40000000737", "final_grade": "REW", "type": "FTUD" }
 *     { "InspectionLot": "40000000737", "UD_CODE": "A1", "type": "FTUD" }
 *
 *   Lot-only (only safe when the lot has a single grade):
 *     { "InspectionLot": "40000000738", "type": "FTUD" }
 *
 *   Bulk (wrapped):
 *     { "lots": [ { "InspectionLot": "..." } ] }
 *
 * `type` is optional local metadata (not sent to SAP). When type = "FTUD" and
 * SAP returns Status "S", order_conf.ud is set true for that inspection_lot.
 */
export const postInspectionLotUdC = async (req, res) => {
    try {
        const body = req.body;

        // Normalize to detect single vs bulk. Support a `lots` wrapper too.
        const entries = Array.isArray(body)
            ? body
            : Array.isArray(body?.lots)
            ? body.lots
            : null;

        // ── Bulk ──────────────────────────────────────────────
        if (entries) {
            if (entries.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No inspection lot entries provided",
                });
            }

            const summary = await postInspectionLotUdBulk(entries);

            // 200 if all posted, 207 (multi-status) if some failed.
            const httpStatus = summary.failed === 0 ? 200 : 207;

            return res.status(httpStatus).json({
                success: summary.failed === 0,
                message:
                    summary.failed === 0
                        ? "All inspection lot UDs posted"
                        : `${summary.posted} posted, ${summary.failed} failed`,
                summary,
            });
        }

        // ── Single ────────────────────────────────────────────
        const result = await postInspectionLotUd(body);

        return res.status(200).json({
            success: true,
            message: "Inspection lot UD posted",
            result,
        });
    } catch (error) {
        console.error("[SAP Inspection Lot UD] error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
            inspection_lot: error.inspection_lot,
            ud_code: error.ud_code,
            sap_response: error.sap_response ?? error.response?.data,
        });
    }
};
