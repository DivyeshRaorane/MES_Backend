import { lockFiberS, unlockFiberS } from "../../../services/fiber_lock/fiber_lock.service.js";

// POST /api/fiber/lock
// Body: { lock_type: "preform" | "spool" | "bobbin", id: string, lock_reason?: string }
//   id = preform_id (preform) | spool_id (spool) | bobbin_no (bobbin)
// Returns: { status, message, data }
export const lockFiberC = async (req, res) => {
    try {
        const { lock_type, id, lock_reason } = req.body || {};
        const result = await lockFiberS({ lock_type, id, lock_reason });

        // The service already returns { status, message, data }; reuse its status as HTTP code.
        return res.status(result.status).json(result);
    } catch (error) {
        console.error("Fiber Lock Error:", error.message);
        return res.status(500).json({ status: 500, message: error.message, data: null });
    }
};

// POST /api/fiber/unlock
// Body: { lock_type: "preform" | "spool" | "bobbin", id: string, unlock_reason?: string }
//   id = preform_id (preform) | spool_id (spool) | bobbin_no (bobbin)
//   lock_reason is saved as "Unlock_reason- <unlock_reason>" (NULL when blank)
// Returns: { status, message, data }
export const unlockFiberC = async (req, res) => {
    try {
        const { lock_type, id, unlock_reason } = req.body || {};
        const result = await unlockFiberS({ lock_type, id, unlock_reason });

        return res.status(result.status).json(result);
    } catch (error) {
        console.error("Fiber Unlock Error:", error.message);
        return res.status(500).json({ status: 500, message: error.message, data: null });
    }
};
