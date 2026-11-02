import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════════════════
// Fiber Lock service
//
// Input : lock_type ('preform' | 'spool' | 'bobbin'), id, lock_reason
// Output: { status, message, data }
//
// Flow (everything runs in one transaction):
//   preform -> preform_accept (must exist and be unlocked)
//              -> draw_entry rows of this preform with lock = false  (spools)
//              -> bobbin_entries rows of those spools with lock = false
//   spool   -> draw_entry (must exist and be unlocked)
//              -> bobbin_entries rows of this spool with lock = false
//   bobbin  -> bobbin_entries (must exist and be unlocked)
//
// Every row that gets locked is set to lock = true, lock_reason = <reason>.
// A blank / missing reason is stored as NULL.
// Rows that are already locked are skipped (left unchanged).
// ═══════════════════════════════════════════════════════════════════════════

const LOCK_TYPES = ["preform", "spool", "bobbin"];

// Blank / whitespace / missing -> null
const cleanReason = (reason) => {
    if (reason === null || reason === undefined) return null;
    const text = String(reason).trim();
    return text === "" ? null : text;
};

// Success payload shared by lock and unlock:
// { lock_type, lock_reason, counts: { preforms, spools, bobbins, total },
//   preforms: [preform_id], spools: [spool_id], bobbins: [bobbin_no] }
const buildResultData = (type, reason, { preforms = [], spools = [], bobbins = [] }) => ({
    lock_type: type,
    lock_reason: reason,
    counts: {
        preforms: preforms.length,
        spools: spools.length,
        bobbins: bobbins.length,
        total: preforms.length + spools.length + bobbins.length,
    },
    preforms,
    spools,
    bobbins,
});

// Lock unlocked bobbins of the given spools; returns locked bobbin_no list.
const lockBobbinsOfSpools = async (client, spoolIds, reason) => {
    if (spoolIds.length === 0) return [];
    const result = await client.query(
        `UPDATE bobbin_entries
         SET lock = TRUE, lock_reason = $2
         WHERE spool_id = ANY($1)
           AND COALESCE(lock, FALSE) = FALSE
         RETURNING bobbin_no`,
        [spoolIds, reason]
    );
    return result.rows.map((r) => r.bobbin_no);
};

const lockPreform = async (client, preformId, reason) => {
    const found = await client.query(
        `SELECT preform_id, lock FROM preform_accept WHERE preform_id = $1 FOR UPDATE`,
        [preformId]
    );
    if (found.rows.length === 0) {
        return { status: 404, message: `Preform ${preformId} not found`, data: null };
    }
    if (found.rows[0].lock === true) {
        return { status: 409, message: `Preform ${preformId} is already locked`, data: null };
    }

    await client.query(
        `UPDATE preform_accept SET lock = TRUE, lock_reason = $2 WHERE preform_id = $1`,
        [preformId, reason]
    );

    // Only spools of this preform that are not locked yet.
    const spools = await client.query(
        `UPDATE draw_entry
         SET lock = TRUE, lock_reason = $2
         WHERE preform_id = $1
           AND COALESCE(lock, FALSE) = FALSE
         RETURNING spool_id`,
        [preformId, reason]
    );
    const spoolIds = spools.rows.map((r) => r.spool_id);

    const bobbinNos = await lockBobbinsOfSpools(client, spoolIds, reason);

    return {
        status: 200,
        message: `Preform ${preformId} locked successfully`,
        data: { preforms: [preformId], spools: spoolIds, bobbins: bobbinNos },
    };
};

const lockSpool = async (client, spoolId, reason) => {
    const found = await client.query(
        `SELECT spool_id, lock FROM draw_entry WHERE spool_id = $1 FOR UPDATE`,
        [spoolId]
    );
    if (found.rows.length === 0) {
        return { status: 404, message: `Spool ${spoolId} not found`, data: null };
    }
    if (found.rows[0].lock === true) {
        return { status: 409, message: `Spool ${spoolId} is already locked`, data: null };
    }

    await client.query(
        `UPDATE draw_entry SET lock = TRUE, lock_reason = $2 WHERE spool_id = $1`,
        [spoolId, reason]
    );

    const bobbinNos = await lockBobbinsOfSpools(client, [spoolId], reason);

    return {
        status: 200,
        message: `Spool ${spoolId} locked successfully`,
        data: { preforms: [], spools: [spoolId], bobbins: bobbinNos },
    };
};

const lockBobbin = async (client, bobbinNo, reason) => {
    const found = await client.query(
        `SELECT bobbin_no, lock FROM bobbin_entries WHERE bobbin_no = $1 FOR UPDATE`,
        [bobbinNo]
    );
    if (found.rows.length === 0) {
        return { status: 404, message: `Bobbin ${bobbinNo} not found`, data: null };
    }
    if (found.rows[0].lock === true) {
        return { status: 409, message: `Bobbin ${bobbinNo} is already locked`, data: null };
    }

    await client.query(
        `UPDATE bobbin_entries SET lock = TRUE, lock_reason = $2 WHERE bobbin_no = $1`,
        [bobbinNo, reason]
    );

    return {
        status: 200,
        message: `Bobbin ${bobbinNo} locked successfully`,
        data: { preforms: [], spools: [], bobbins: [bobbinNo] },
    };
};

/**
 * @param {{lock_type:string, id:string, lock_reason?:string}} payload
 * @returns {Promise<{status:number, message:string, data:Object|null}>}
 */
export const lockFiberS = async ({ lock_type, id, lock_reason } = {}) => {
    const type = String(lock_type ?? "").trim().toLowerCase();
    const targetId = String(id ?? "").trim();
    const reason = cleanReason(lock_reason);

    if (!LOCK_TYPES.includes(type)) {
        return { status: 400, message: `lock_type must be one of: ${LOCK_TYPES.join(", ")}`, data: null };
    }
    if (targetId === "") {
        return { status: 400, message: `${type} id is required`, data: null };
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let result;
        if (type === "preform") result = await lockPreform(client, targetId, reason);
        else if (type === "spool") result = await lockSpool(client, targetId, reason);
        else result = await lockBobbin(client, targetId, reason);

        // Validation failures (404 / 409) change nothing.
        await client.query(result.status === 200 ? "COMMIT" : "ROLLBACK");

        if (result.status === 200) {
            result.data = buildResultData(type, reason, result.data);
        }
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// Fiber Unlock service (mirror of lock)
//
// Input : lock_type ('preform' | 'spool' | 'bobbin'), id, unlock_reason
//
// Flow (everything runs in one transaction):
//   preform -> preform_accept (must exist and be locked)
//              -> draw_entry rows of this preform with lock = true  (spools)
//              -> bobbin_entries rows of those spools with lock = true
//   spool   -> draw_entry (must exist and be locked)
//              -> bobbin_entries rows of this spool with lock = true
//   bobbin  -> bobbin_entries (must exist and be locked)
//
// Every row that gets unlocked is set to lock = false,
// lock_reason = "Unlock_reason- <reason>". A blank / missing reason -> NULL.
// Rows that are already unlocked are skipped (left unchanged).
// ═══════════════════════════════════════════════════════════════════════════

const UNLOCK_PREFIX = "Unlock_reason- ";

// "Unlock_reason- <reason>", or null when the reason is blank / missing
const buildUnlockReason = (reason) => {
    const text = cleanReason(reason);
    return text === null ? null : `${UNLOCK_PREFIX}${text}`;
};

// Unlock locked bobbins of the given spools; returns unlocked bobbin_no list.
const unlockBobbinsOfSpools = async (client, spoolIds, reason) => {
    if (spoolIds.length === 0) return [];
    const result = await client.query(
        `UPDATE bobbin_entries
         SET lock = FALSE, lock_reason = $2
         WHERE spool_id = ANY($1)
           AND lock = TRUE
         RETURNING bobbin_no`,
        [spoolIds, reason]
    );
    return result.rows.map((r) => r.bobbin_no);
};

const unlockPreform = async (client, preformId, reason) => {
    const found = await client.query(
        `SELECT preform_id, lock FROM preform_accept WHERE preform_id = $1 FOR UPDATE`,
        [preformId]
    );
    if (found.rows.length === 0) {
        return { status: 404, message: `Preform ${preformId} not found`, data: null };
    }
    if (found.rows[0].lock !== true) {
        return { status: 409, message: `Preform ${preformId} is already unlocked`, data: null };
    }

    await client.query(
        `UPDATE preform_accept SET lock = FALSE, lock_reason = $2 WHERE preform_id = $1`,
        [preformId, reason]
    );

    // Only spools of this preform that are currently locked.
    const spools = await client.query(
        `UPDATE draw_entry
         SET lock = FALSE, lock_reason = $2
         WHERE preform_id = $1
           AND lock = TRUE
         RETURNING spool_id`,
        [preformId, reason]
    );
    const spoolIds = spools.rows.map((r) => r.spool_id);

    const bobbinNos = await unlockBobbinsOfSpools(client, spoolIds, reason);

    return {
        status: 200,
        message: `Preform ${preformId} unlocked successfully`,
        data: { preforms: [preformId], spools: spoolIds, bobbins: bobbinNos },
    };
};

const unlockSpool = async (client, spoolId, reason) => {
    const found = await client.query(
        `SELECT spool_id, lock FROM draw_entry WHERE spool_id = $1 FOR UPDATE`,
        [spoolId]
    );
    if (found.rows.length === 0) {
        return { status: 404, message: `Spool ${spoolId} not found`, data: null };
    }
    if (found.rows[0].lock !== true) {
        return { status: 409, message: `Spool ${spoolId} is already unlocked`, data: null };
    }

    await client.query(
        `UPDATE draw_entry SET lock = FALSE, lock_reason = $2 WHERE spool_id = $1`,
        [spoolId, reason]
    );

    const bobbinNos = await unlockBobbinsOfSpools(client, [spoolId], reason);

    return {
        status: 200,
        message: `Spool ${spoolId} unlocked successfully`,
        data: { preforms: [], spools: [spoolId], bobbins: bobbinNos },
    };
};

const unlockBobbin = async (client, bobbinNo, reason) => {
    const found = await client.query(
        `SELECT bobbin_no, lock FROM bobbin_entries WHERE bobbin_no = $1 FOR UPDATE`,
        [bobbinNo]
    );
    if (found.rows.length === 0) {
        return { status: 404, message: `Bobbin ${bobbinNo} not found`, data: null };
    }
    if (found.rows[0].lock !== true) {
        return { status: 409, message: `Bobbin ${bobbinNo} is already unlocked`, data: null };
    }

    await client.query(
        `UPDATE bobbin_entries SET lock = FALSE, lock_reason = $2 WHERE bobbin_no = $1`,
        [bobbinNo, reason]
    );

    return {
        status: 200,
        message: `Bobbin ${bobbinNo} unlocked successfully`,
        data: { preforms: [], spools: [], bobbins: [bobbinNo] },
    };
};

/**
 * @param {{lock_type:string, id:string, unlock_reason?:string}} payload
 * @returns {Promise<{status:number, message:string, data:Object|null}>}
 */
export const unlockFiberS = async ({ lock_type, id, unlock_reason } = {}) => {
    const type = String(lock_type ?? "").trim().toLowerCase();
    const targetId = String(id ?? "").trim();
    const reason = buildUnlockReason(unlock_reason);

    if (!LOCK_TYPES.includes(type)) {
        return { status: 400, message: `lock_type must be one of: ${LOCK_TYPES.join(", ")}`, data: null };
    }
    if (targetId === "") {
        return { status: 400, message: `${type} id is required`, data: null };
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let result;
        if (type === "preform") result = await unlockPreform(client, targetId, reason);
        else if (type === "spool") result = await unlockSpool(client, targetId, reason);
        else result = await unlockBobbin(client, targetId, reason);

        // Validation failures (404 / 409) change nothing.
        await client.query(result.status === 200 ? "COMMIT" : "ROLLBACK");

        if (result.status === 200) {
            result.data = buildResultData(type, reason, result.data);
        }
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
