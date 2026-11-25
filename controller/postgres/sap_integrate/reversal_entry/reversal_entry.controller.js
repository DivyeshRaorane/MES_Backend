import { reverseDrawEntry } from "../../../../services/sap_integrate/reversal_entry/GRN/draw_reversal.js";
import { reversePtEntry } from "../../../../services/sap_integrate/reversal_entry/GRN/pt_reversal.service.js";
import { reverseUdEntry } from "../../../../services/sap_integrate/reversal_entry/UD/ud_reversal.service.js";
import { makeUdEntry } from "../../../../services/sap_integrate/reversal_entry/UD/ud_make.service.js";

/**
 * Reversal / make-UD controllers.
 *
 * Error mapping:
 *   err.code = "VALIDATION" -> 400 (a rule was not met, nothing was changed)
 *   err.code = "SAP_ERROR"  -> 502 (SAP rejected the call, nothing was changed locally)
 *   anything else           -> 500
 *
 * The user (emp_id) comes from the MES JWT (req.user).
 */

const sendError = (res, label, error) => {
    console.error(`[${label}] Error:`, error.message);

    if (error.code === "VALIDATION") {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === "SAP_ERROR") {
        return res.status(502).json({
            success: false,
            message: error.message,
            sap_response: error.sap_response ?? null,
        });
    }
    return res.status(500).json({ success: false, message: error.message });
};

/**
 * POST /api/reversal/draw
 * body: { "spool_id": "..." }
 */
export const reverseDrawEntryC = async (req, res) => {
    try {
        const result = await reverseDrawEntry(req.body?.spool_id, req.user?.emp_id);
        return res.status(200).json(result);
    } catch (error) {
        return sendError(res, "Draw Reversal", error);
    }
};

/**
 * POST /api/reversal/pt
 * body: { "bobbin_no": "..." }
 */
export const reversePtEntryC = async (req, res) => {
    try {
        const result = await reversePtEntry(req.body?.bobbin_no, req.user?.emp_id);
        return res.status(200).json(result);
    } catch (error) {
        return sendError(res, "PT Reversal", error);
    }
};

/**
 * POST /api/reversal/ud
 * body: { "bobbin_no": "...", "ud_type": "UD1" }
 */
export const reverseUdEntryC = async (req, res) => {
    try {
        const result = await reverseUdEntry(
            req.body?.bobbin_no,
            req.body?.ud_type,
            req.user?.emp_id
        );
        return res.status(200).json(result);
    } catch (error) {
        return sendError(res, "UD Reversal", error);
    }
};

/**
 * POST /api/reversal/ud/make
 * body: { "bobbin_no": "...", "ud_type": "UD1" }
 */
export const makeUdEntryC = async (req, res) => {
    try {
        const result = await makeUdEntry(
            req.body?.bobbin_no,
            req.body?.ud_type,
            req.user?.emp_id
        );
        return res.status(200).json(result);
    } catch (error) {
        return sendError(res, "Make UD", error);
    }
};
