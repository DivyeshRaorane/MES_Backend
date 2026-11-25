import axios from "axios";
import pool from "../../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../../auth/sap_auth.service.js";
import { logSapCall } from "../../sap_log.service.js";

/**
 * PT (proof test) reversal - MES side.
 *
 * Input: bobbin_no (from the frontend).
 *
 * Checks (any failure stops the reversal, nothing is changed):
 *   1. a pt_entry row exists for the bobbin_no   (bobbin_no, is_last, is_sample)
 *   2. a bobbin_entries row exists for it        (bobbin_no, spool_id, fiber_length,
 *                                                 is_qc_out, is_pv, d2_issue)
 *   3. d2_issue is not true
 *   4. is_qc_out is not true
 *
 * Then, in ONE transaction (SAP confirmation is cancelled first):
 *   - delete the pt_entry row, then the bobbin_entries row
 *   - mat_stock (batch_id = spool_id): balance_qty + fiber_length,
 *     p_count - 1, last_fid = FID of the latest remaining PT entry
 *   - pt_allocation of the spool (always) -> is_pt_complete = false,
 *     pt_machine_no = 0
 *   - is_last = false: all PT entries of the spool are re-chained
 *                      (start_length = previous end_length,
 *                       end_length = start + pt_length)
 *   - is_sample = true: the next PT entry (has bobbin_no and fid) becomes
 *                      is_sample = true; when there is none, the previous one
 *   - insert a pt_reverse_log row
 *   - transactions: reverse_status = true for the bobbin's FG transaction
 *
 * Table needed: see Schemas/postgresql/pt_reverse_log.sql
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

const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));
const round = (v, dp = 3) => Number(Number(v).toFixed(dp));

/**
 * Reverse the PT entry that created a bobbin.
 * @param {string} rawBobbinNo
 * @param {string} reversedBy  emp_id from the MES JWT
 */
export const reversePtEntry = async (rawBobbinNo, reversedBy) => {
    const bobbinNo = normalizeBobbinNo(rawBobbinNo);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock this bobbin's FG / UD transaction rows until COMMIT / ROLLBACK so the
        // scheduler cannot post them while the reversal runs (and vice versa).
        try {
            await client.query(
                `SELECT transaction_id
                   FROM transactions
                  WHERE fg_batch = $1
                    AND "type" IN ('FG', 'UD')
                    AND COALESCE(reverse_status, false) = false
                    FOR UPDATE NOWAIT`,
                [bobbinNo]
            );
        } catch (lockError) {
            if (lockError.code === "55P03") {
                throw validationError(
                    "This bobbin is being posted to SAP right now. Try again in a minute."
                );
            }
            throw lockError;
        }

        // 1) PT entry must exist (row is locked until commit)
        const ptRes = await client.query(
            `SELECT pt_entry_id, bobbin_no, is_last, is_sample
               FROM pt_entry
              WHERE bobbin_no = $1
                FOR UPDATE`,
            [bobbinNo]
        );
        if (ptRes.rows.length === 0) {
            throw validationError("There is no PT entry against this bobbin_no.");
        }
        const pt = ptRes.rows[0];
        const isLast = pt.is_last === true;
        const isSample = pt.is_sample === true;

        // 2) bobbin entry must exist
        const bobbinRes = await client.query(
            `SELECT bobbin_no, spool_id, fiber_length, is_qc_out, is_pv, d2_issue
               FROM bobbin_entries
              WHERE bobbin_no = $1
                FOR UPDATE`,
            [bobbinNo]
        );
        if (bobbinRes.rows.length === 0) {
            throw validationError("There is no bobbin entry against this bobbin_no.");
        }
        const bobbin = bobbinRes.rows[0];
        const spoolId = bobbin.spool_id;
        const fiberLength = num(bobbin.fiber_length);

        // 3) d2_issue must not be true (column is VARCHAR in the schema file, so accept 'true' text too)
        const d2 = bobbin.d2_issue;
        if (d2 === true || String(d2).trim().toLowerCase() === "true") {
            throw validationError("D2 issue this bobbin. We cannot process the reversal.");
        }

        // 4) must not be QC out
        if (bobbin.is_qc_out === true) {
            throw validationError("QC out is done for this bobbin. We cannot process the reversal.");
        }

        // SAP: cancel the FG confirmation first. Skipped (success) when the FG
        // transaction was never posted. If SAP fails this throws, so nothing in
        // MES is changed (the transaction rolls back).
        const sapResult = await reversePtInSAP(bobbinNo, client);

        // 5/6) delete the PT entry and the bobbin
        await client.query(`DELETE FROM pt_entry WHERE pt_entry_id = $1`, [pt.pt_entry_id]);
        await client.query(`DELETE FROM bobbin_entries WHERE bobbin_no = $1`, [bobbinNo]);

        // Remaining PT entries of the spool, in entry order.
        const remainingRes = await client.query(
            `SELECT pt_entry_id, fid, pt_length
               FROM pt_entry
              WHERE spool_id = $1
              ORDER BY pt_entry_id ASC`,
            [spoolId]
        );
        const remaining = remainingRes.rows;
        const withFid = remaining.filter((r) => r.fid != null && r.fid !== "");
        const lastFid = withFid.length ? withFid[withFid.length - 1].fid : null;

        // Give the length back to the spool stock.
        const stockRes = await client.query(
            `UPDATE mat_stock
                SET balance_qty = COALESCE(balance_qty, 0) + $2,
                    p_count = GREATEST(COALESCE(p_count, 0) - 1, 0),
                    last_fid = $3
              WHERE batch_id = $1
          RETURNING balance_qty`,
            [spoolId, fiberLength, lastFid]
        );
        if (stockRes.rowCount === 0) {
            throw validationError("Material stock not found for this spool.");
        }

        // Always (last or not): the spool is no longer PT complete and has no machine.
        await client.query(
            `UPDATE pt_allocation
                SET is_pt_complete = FALSE,
                    pt_machine_no = 0
              WHERE spool_id = $1`,
            [spoolId]
        );

        // Not the last entry: close the gap in start_length / end_length.
        const relengthed = [];
        if (!isLast) {
            let cursor = 0;
            for (const row of remaining) {
                const start = round(cursor);
                const end = round(start + num(row.pt_length));
                await client.query(
                    `UPDATE pt_entry SET start_length = $2, end_length = $3 WHERE pt_entry_id = $1`,
                    [row.pt_entry_id, start, end]
                );
                relengthed.push({ pt_entry_id: row.pt_entry_id, start_length: start, end_length: end });
                cursor = end;
            }
        }

        // 7) sample flag moves to the next bobbin entry, else the previous one.
        let sampleMovedTo = null;
        if (isSample) {
            let target = await client.query(
                `SELECT pt_entry_id, bobbin_no
                   FROM pt_entry
                  WHERE spool_id = $1
                    AND pt_entry_id > $2
                    AND bobbin_no IS NOT NULL AND bobbin_no != ''
                    AND fid IS NOT NULL AND fid != ''
                  ORDER BY pt_entry_id ASC
                  LIMIT 1`,
                [spoolId, pt.pt_entry_id]
            );
            if (target.rows.length === 0) {
                target = await client.query(
                    `SELECT pt_entry_id, bobbin_no
                       FROM pt_entry
                      WHERE spool_id = $1
                        AND pt_entry_id < $2
                        AND bobbin_no IS NOT NULL AND bobbin_no != ''
                        AND fid IS NOT NULL AND fid != ''
                      ORDER BY pt_entry_id DESC
                      LIMIT 1`,
                    [spoolId, pt.pt_entry_id]
                );
            }
            if (target.rows.length > 0) {
                await client.query(`UPDATE pt_entry SET is_sample = TRUE WHERE pt_entry_id = $1`, [
                    target.rows[0].pt_entry_id,
                ]);
                sampleMovedTo = target.rows[0].bobbin_no;
            }
        }

        // 8) log
        await client.query(
            `INSERT INTO pt_reverse_log
                (bobbin_no, spool_id, fiber_length, is_last, is_sample, reversed_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [bobbinNo, spoolId, fiberLength, isLast, isSample, reversedBy ?? null]
        );

        // Last step: flag the bobbin's FG transaction(s) as reversed.
        await client.query(
            `UPDATE transactions
                SET reverse_status = true
              WHERE fg_batch = $1
                AND "type" = 'FG'`,
            [bobbinNo]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "PT entry reversed successfully",
            bobbin_no: bobbinNo,
            spool_id: spoolId,
            is_last: isLast,
            is_sample: isSample,
            sample_moved_to: sampleMovedTo,
            restored_qty: fiberLength,
            spool_balance_qty: Number(stockRes.rows[0].balance_qty),
            updated_entries: relengthed,
            sap: sapResult,
        };
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }
};

/* ═══════════════════════════════════════════════════════════════════════
   SAP side: cancel the FG production-order confirmation of a bobbin
   ═══════════════════════════════════════════════════════════════════════

 * Separate from reversePtEntry (MES). Call it on its own and use the
 * returned object for the next transaction.
 *
 * Flow for a bobbin_no (the FG batch of the PT entry):
 *   1. transactions: latest row with fg_batch = bobbin_no AND "type" = 'FG'
 *        - none found          -> nothing was posted to SAP: skipped (success)
 *        - status = false      -> never posted to SAP, nothing to reverse: skipped (success)
 *        - status = true       -> continue
 *   2. order_conf: row with fg_batch = bobbin_no (latest, not already cancelled)
 *        gives confrmation_no and confirmation_counter
 *   2b. UD of order_conf.inspection_lot (see checkUdBeforePtReversal): UD
 *      transactions with status false -> reverse_status = true; status true ->
 *      error, the UD must be reversed first (separate UD reversal service).
 *   3. POST SAP_BASE_URL + "production-order-confirmation-cancel" with
 *        { "ConfirmationCount": "<counter, 8 digits>", "ConfirmationGroup": "<conf no, 10 digits>" }
 *      using the SAP bearer token (one re-login and retry on a 401).
 *   4. return SAP's reply.
 *
 * The endpoint name can be overridden with SAP_PRODUCTION_ORDER_CONFIRMATION_CANCEL_ENDPOINT.
 */

const CANCEL_ENDPOINT = () =>
    process.env.SAP_PRODUCTION_ORDER_CONFIRMATION_CANCEL_ENDPOINT ||
    "production-order-confirmation-cancel";

const SAP_TIMEOUT_MS = Number(process.env.SAP_REQUEST_TIMEOUT_MS) || 30000;

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const postWithAuth = async (url, payload) => {
    const send = async (forceRefresh) =>
        axios({
            method: "POST",
            url,
            data: payload,
            timeout: SAP_TIMEOUT_MS,
            headers: {
                "Content-Type": "application/json",
                ...(await sapAuthHeader(forceRefresh)),
            },
        });

    try {
        const response = await send(false);
        return { data: response.data ?? {}, httpStatus: response.status };
    } catch (error) {
        if (error.response?.status === 401) {
            clearSapToken();
            const response = await send(true);
            return { data: response.data ?? {}, httpStatus: response.status };
        }
        throw error;
    }
};

// SAP expects zero-padded strings: counter 9 -> "00000009", conf no 2216 -> "0000002216".
const padNum = (v, len) => String(v).replace(/\D/g, "").padStart(len, "0");

/**
 * UD (usage decision) gate for the PT reversal. Does NOT call SAP.
 *
 * UD transactions of the bobbin's inspection lot: transactions rows with
 * type = 'UD', inspection_lot = lot, fg_batch = bobbin_no, reverse_status not true.
 *   - no inspection lot / no UD row -> nothing to do
 *   - every UD row has status = false (never posted to SAP)
 *                                   -> reverse_status = true (on the caller's client)
 *   - any UD row has status = true  -> error: the UD must be reversed first
 *
 * @param {string} bobbinNo
 * @param {string|number|null} inspectionLot  order_conf.inspection_lot
 * @param {object} db  the reversal's client (same transaction)
 */
const checkUdBeforePtReversal = async (bobbinNo, inspectionLot, db) => {
    const lot = inspectionLot === undefined || inspectionLot === null ? "" : String(inspectionLot).trim();
    if (!lot || Number(lot) === 0) {
        return { skipped: true, message: "No inspection lot. UD check skipped." };
    }

    const udRes = await db.query(
        `SELECT transaction_id, status
           FROM transactions
          WHERE "type" = 'UD'
            AND inspection_lot = $1
            AND fg_batch = $2
            AND COALESCE(reverse_status, false) = false
          ORDER BY transaction_id ASC`,
        [Number(lot), bobbinNo]
    );
    if (udRes.rows.length === 0) {
        return { skipped: true, inspection_lot: lot, message: "No UD transaction found for this inspection lot." };
    }

    if (udRes.rows.some((r) => r.status === true)) {
        throw validationError(
            "UD is already posted to SAP for this bobbin. Reverse the UD first, then retry the PT reversal."
        );
    }

    const ids = udRes.rows.map((r) => r.transaction_id);
    await db.query(`UPDATE transactions SET reverse_status = true WHERE transaction_id = ANY($1::int[])`, [ids]);
    return {
        skipped: false,
        inspection_lot: lot,
        message: "UD transaction was not posted to SAP (status = false). Marked as reversed.",
    };
};


/**
 * Cancel the SAP confirmation of a bobbin's FG transaction.
 * @param {string} rawBobbinNo
 * @returns {Promise<{
 *   success: boolean, skipped: boolean, message: string, bobbin_no: string,
 *   payload?: object, sap_response?: object
 * }>}
 */
export const reversePtInSAP = async (rawBobbinNo, db = pool) => {
    const bobbinNo = normalizeBobbinNo(rawBobbinNo);

    // 1) FG transaction of this bobbin
    const txnRes = await db.query(
        `SELECT transaction_id, status
           FROM transactions
          WHERE fg_batch = $1
            AND "type" = 'FG'
          ORDER BY transaction_id DESC
          LIMIT 1`,
        [bobbinNo]
    );

    if (txnRes.rows.length === 0 || txnRes.rows[0].status !== true) {
        return {
            success: true,
            skipped: true,
            bobbin_no: bobbinNo,
            message:
                txnRes.rows.length === 0
                    ? "No FG transaction found for this bobbin. SAP reversal skipped."
                    : "FG transaction was not posted to SAP (status = false). SAP reversal skipped.",
        };
    }

    // 2) confirmation details
    const confRes = await db.query(
        `SELECT order_no, confrmation_no, confirmation_counter, inspection_lot
           FROM order_conf
          WHERE fg_batch = $1
            AND COALESCE(cancelling_flag, false) = false
          ORDER BY order_conf_id DESC
          LIMIT 1`,
        [bobbinNo]
    );
    const conf = confRes.rows[0];
    if (!conf || conf.confrmation_no == null || conf.confirmation_counter == null) {
        throw validationError(
            "FG transaction is posted to SAP but no confirmation (order_conf) was found for this bobbin."
        );
    }

    // 2b) usage decision (UD) gate: an unposted UD is marked reversed, a posted
    // UD must be reversed first (separate UD reversal), otherwise this throws.
    const udReversal = await checkUdBeforePtReversal(bobbinNo, conf.inspection_lot, db);

    const payload = {
        ConfirmationCount: padNum(conf.confirmation_counter, 8),
        ConfirmationGroup: padNum(conf.confrmation_no, 10),
    };

    // 3) call SAP
    const endpoint = CANCEL_ENDPOINT();
    const url = buildSapUrl(endpoint);
    const startedAt = Date.now();
    console.log("[PT Reversal SAP] POST URL:", url, payload);

    let result;
    try {
        result = await postWithAuth(url, payload);
    } catch (httpError) {
        const upstream = httpError.response?.data;
        const msg = upstream?.Message || upstream?.message || httpError.message;
        await logSapCall({
            operation: "PT_REVERSAL_CANCEL_CONFIRMATION",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: msg,
            reference_type: "BOBBIN",
            reference_id: bobbinNo,
            request_payload: payload,
            response_payload: upstream,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        const err = new Error(`SAP confirmation cancel failed: ${msg}`);
        err.code = "SAP_ERROR";
        err.sap_response = upstream;
        throw err;
    }

    const sapResponse = result.data;
    await logSapCall({
        operation: "PT_REVERSAL_CANCEL_CONFIRMATION",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        http_status_code: result.httpStatus,
        message: sapResponse?.Message || sapResponse?.message,
        reference_type: "BOBBIN",
        reference_id: bobbinNo,
        request_payload: payload,
        response_payload: sapResponse,
        duration_ms: Date.now() - startedAt,
    });

    // 4) hand SAP's reply back for the next transaction
    return {
        success: true,
        skipped: false,
        bobbin_no: bobbinNo,
        message: sapResponse?.Message || "SAP confirmation cancelled",
        payload,
        sap_response: sapResponse,
        ud_reversal: udReversal,
    };
};

export default reversePtEntry;
