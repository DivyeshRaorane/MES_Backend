import pool from "../../../../db/postgres.js";
import { postUdRow } from "../../sap_transaction/transaction_post.service.js";

/**
 * Make UD (usage decision) again for a bobbin whose UD was reversed.
 *
 * Input: bobbin_no and ud_type (UD1 / UD2 / UD3 ...).
 *
 * Allowed only when a transactions row exists with
 *   "type" = 'UD', fg_batch = bobbin_no, ud_type = <requested>,
 *   status = false AND reverse_status = true
 * (the state ud_reversal.service.js leaves a reversed UD in). Anything else is an error.
 *
 * Then, in ONE transaction:
 *   - the row is posted through the same UD logic the scheduler uses
 *     (postUdRow: UD code from the grade / ud_type, the UD1 result record and
 *     the rewind material document gates, then the inspection-lot UD API)
 *   - on success the row becomes status = true, reverse_status = false
 *     (so the UD can be reversed again later)
 *   - on any failure (SAP error, grade not available, PV not done ...) the
 *     transaction rolls back and the row stays status = false, reverse_status = true
 */

const validationError = (message) => {
    const err = new Error(message);
    err.code = "VALIDATION";
    return err;
};

export const normalizeBobbinNo = (v) => {
    const bobbinNo = v === undefined || v === null ? "" : String(v).trim();
    if (!bobbinNo) throw validationError("bobbin_no is required");
    return bobbinNo;
};

export const normalizeUdType = (v) => {
    const udType = v === undefined || v === null ? "" : String(v).trim().toUpperCase();
    if (!udType) throw validationError("ud_type is required");
    if (!/^UD\d+$/.test(udType)) {
        throw validationError("ud_type must be like UD1, UD2, UD3");
    }
    return udType;
};

/**
 * @param {string} rawBobbinNo
 * @param {string} rawUdType   UD1 / UD2 / UD3 ...
 * @param {string} madeBy      emp_id from the MES JWT
 */
export const makeUdEntry = async (rawBobbinNo, rawUdType, madeBy) => {
    const bobbinNo = normalizeBobbinNo(rawBobbinNo);
    const udType = normalizeUdType(rawUdType);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // The bobbin's UD rows, locked until COMMIT / ROLLBACK so the scheduler
        // or a reversal cannot touch them meanwhile.
        let udRows;
        try {
            const res = await client.query(
                `SELECT *
                   FROM transactions
                  WHERE "type" = 'UD'
                    AND fg_batch = $1
                  ORDER BY transaction_id ASC
                    FOR UPDATE NOWAIT`,
                [bobbinNo]
            );
            udRows = res.rows;
        } catch (lockError) {
            if (lockError.code === "55P03") {
                throw validationError(
                    "This bobbin's UD is being processed right now. Try again in a minute."
                );
            }
            throw lockError;
        }

        // Latest row of the requested ud_type.
        const sameType = udRows.filter(
            (r) => String(r.ud_type || "").trim().toUpperCase() === udType
        );
        if (sameType.length === 0) {
            throw validationError(`There is no ${udType} transaction against this bobbin_no.`);
        }
        const row = sameType[sameType.length - 1];

        // Only a reversed, unposted UD can be made again.
        if (!(row.status === false || row.status === null) || row.reverse_status !== true) {
            throw validationError(
                `${udType} cannot be made for this bobbin_no. UD can only be made after it is reversed ` +
                    `(status = false and reverse_status = true).`
            );
        }

        // Post it. The SAP calls and the status = true update run on this client.
        let result;
        try {
            result = await postUdRow(row, client);
        } catch (postError) {
            if (postError.isSkip) {
                // e.g. grade not available yet, or PV not done
                throw validationError(String(postError.message).replace(/^skip:\s*/i, ""));
            }
            throw postError;
        }

        // Back to a normal posted UD: status = true (set by postUdRow), reverse_status = false.
        await client.query(
            `UPDATE transactions
                SET reverse_status = false,
                    updated_at = CURRENT_TIMESTAMP
              WHERE transaction_id = $1`,
            [row.transaction_id]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: `${udType} made successfully`,
            bobbin_no: bobbinNo,
            ud_type: udType,
            inspection_lot: row.inspection_lot,
            made_by: madeBy ?? null,
            sap: result?.response ?? null,
        };
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }
};

export default makeUdEntry;
