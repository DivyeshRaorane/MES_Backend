import axios from "axios";
import pool from "../../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../../auth/sap_auth.service.js";
import { logSapCall } from "../../sap_log.service.js";

/**
 * Draw (spool) reversal - MES side.
 *
 * Input: spool_id (from the frontend).
 *
 * Checks (any failure stops the reversal, nothing is changed):
 *   1. a draw_entry row exists for the spool_id
 *   2. no bobbin_entries row exists for the spool_id (PT entry already done)
 *   3. no pt_allocation row exists for the spool_id (already PT allocated)
 *
 * Then, in ONE transaction:
 *   - delete the spool's draw_flaw_details / pt_flaw_details rows (FK to draw_entry)
 *   - delete the draw_entry row
 *   - preform_allocation: preform_draw = false, tower_no = 0 (for the preform)
 *   - mat_stock: delete the spool's row (batch_id = spool_id)
 *   - mat_stock: add the drawn weight back to the preform's balance_qty
 *       balance_weight >= 0 -> + drawn_weight
 *       balance_weight <  0 -> + (drawn_weight - |balance_weight|)
 *     (a negative balance_weight means the draw used more than the preform had
 *      left, so only drawn_weight - |balance_weight| was really taken from stock)
 *   - p_count is reduced by 1 and last_fid is set to the latest remaining spool
 *   - is_last = false only: the remaining spools of the preform are re-chained
 *       spool1 0-200, spool2 200-350, spool3 350-550
 *       delete spool2 -> spool1 0-200, spool3 200-400
 *     (each start_length = previous end_length, end_length = start + drawn_length)
 *   - insert a draw_reverse_log row
 *
 * Table needed: see Schemas/postgresql/draw_reverse_log.sql
 */

const validationError = (message) => {
    const err = new Error(message);
    err.code = "VALIDATION";
    return err;
};

export const normalizeSpoolId = (v) => {
    const spoolId = v === undefined || v === null ? "" : String(v).trim();
    if (!spoolId) throw validationError("spool_id is required");
    return spoolId;
};

const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));
const round = (v, dp = 2) => Number(Number(v).toFixed(dp));

/**
 * Reverse a draw entry for a spool.
 * @param {string} rawSpoolId
 * @param {string} reversedBy  emp_id from the MES JWT
 */
export const reverseDrawEntry = async (rawSpoolId, reversedBy) => {
    const spoolId = normalizeSpoolId(rawSpoolId);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock this spool's FG transaction rows until COMMIT / ROLLBACK so the
        // scheduler cannot post them while the reversal runs (and vice versa).
        try {
            await client.query(
                `SELECT transaction_id
                   FROM transactions
                  WHERE fg_batch = $1
                    AND "type" = 'FG'
                    AND COALESCE(reverse_status, false) = false
                    FOR UPDATE NOWAIT`,
                [spoolId]
            );
        } catch (lockError) {
            if (lockError.code === "55P03") {
                throw validationError(
                    "This spool is being posted to SAP right now. Try again in a minute."
                );
            }
            throw lockError;
        }

        // 1) draw entry must exist (row is locked until commit)
        const drawRes = await client.query(
            `SELECT spool_id, preform_id, is_last, drawn_length, drawn_weight, balance_weight
               FROM draw_entry
              WHERE spool_id = $1
                FOR UPDATE`,
            [spoolId]
        );
        if (drawRes.rows.length === 0) {
            throw validationError("There is no draw entry against this batch (spool_id).");
        }

        // 2) PT entry must not be done (bobbin_entries)
        const bobbinRes = await client.query(
            `SELECT 1 FROM bobbin_entries WHERE spool_id = $1 LIMIT 1`,
            [spoolId]
        );
        if (bobbinRes.rows.length > 0) {
            throw validationError(
                "PT entry already done against this spool_id. We cannot process the reversal."
            );
        }

        // 3) must not be PT allocated
        const ptAllocRes = await client.query(
            `SELECT 1 FROM pt_allocation WHERE spool_id = $1 LIMIT 1`,
            [spoolId]
        );
        if (ptAllocRes.rows.length > 0) {
            throw validationError(
                "This spool_id is already PT allocated. We cannot process the reversal."
            );
        }

        // SAP: cancel the FG confirmation first. Skipped (success) when the FG
        // transaction was never posted. If SAP fails this throws, so nothing in
        // MES is changed (the transaction rolls back).
        const sapResult = await reverseDrawInSAP(spoolId, client);

        // 4) values of this spool
        const draw = drawRes.rows[0];
        const preformId = draw.preform_id;
        const isLast = draw.is_last === true;
        const drawnWeight = num(draw.drawn_weight);
        const drawnLength = num(draw.drawn_length);
        const balanceWeight = num(draw.balance_weight);

        // Weight to give back to the preform stock.
        const restoreQty = balanceWeight >= 0 ? drawnWeight : drawnWeight - balanceWeight;

        // 5/6) delete the spool and everything hanging off it
        await client.query(`DELETE FROM draw_flaw_details WHERE spool_id = $1`, [spoolId]);
        await client.query(`DELETE FROM pt_flaw_details WHERE spool_id = $1`, [spoolId]);
        await client.query(`DELETE FROM draw_entry WHERE spool_id = $1`, [spoolId]);

        await client.query(
            `UPDATE preform_allocation
                SET preform_draw = false,
                    tower_no = 0
              WHERE preform_id = $1`,
            [preformId]
        );

        await client.query(`DELETE FROM mat_stock WHERE batch_id = $1`, [spoolId]);

        // Spools of the same preform that remain, in draw order.
        const remainingRes = await client.query(
            `SELECT spool_id, spool_fid, drawn_length
               FROM draw_entry
              WHERE preform_id = $1
              ORDER BY start_length ASC NULLS LAST, created_at ASC, spool_id ASC`,
            [preformId]
        );
        const remaining = remainingRes.rows;
        const lastRemainingFid = remaining.length
            ? remaining[remaining.length - 1].spool_fid
            : null;

        const stockRes = await client.query(
            `UPDATE mat_stock
                SET balance_qty = COALESCE(balance_qty, 0) + $2,
                    p_count = GREATEST(COALESCE(p_count, 0) - 1, 0),
                    last_fid = $3,
                    updated_at = CURRENT_TIMESTAMP
              WHERE batch_id = $1
          RETURNING balance_qty`,
            [preformId, restoreQty, lastRemainingFid]
        );

        // Not the last spool: close the gap in start_length / end_length.
        let relengthed = [];
        if (!isLast) {
            let cursor = 0;
            for (const row of remaining) {
                const start = cursor;
                const end = round(start + num(row.drawn_length));
                await client.query(
                    `UPDATE draw_entry
                        SET start_length = $2,
                            end_length = $3
                      WHERE spool_id = $1`,
                    [row.spool_id, start, end]
                );
                relengthed.push({ spool_id: row.spool_id, start_length: start, end_length: end });
                cursor = end;
            }
        }

        await client.query(
            `INSERT INTO draw_reverse_log
                (spool_id, preform_id, drawn_weight, drawn_length, is_last, reversed_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [spoolId, preformId, drawnWeight, drawnLength, isLast, reversedBy ?? null]
        );

        // Last step: flag the spool's FG transaction(s) as reversed.
        await client.query(
            `UPDATE transactions
                SET reverse_status = true
              WHERE fg_batch = $1
                AND "type" = 'FG'`,
            [spoolId]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "Draw entry reversed successfully",
            spool_id: spoolId,
            preform_id: preformId,
            is_last: isLast,
            restored_qty: restoreQty,
            preform_balance_qty: stockRes.rows[0] ? Number(stockRes.rows[0].balance_qty) : null,
            updated_spools: relengthed,
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
   SAP side: cancel the FG production-order confirmation of a spool
   ═══════════════════════════════════════════════════════════════════════

 * Separate from reverseDrawEntry (MES). Call it on its own and use the
 * returned object for the next transaction.
 *
 * Flow for a spool_id:
 *   1. transactions: latest row with fg_batch = spool_id AND "type" = 'FG'
 *        - none found          -> nothing was posted to SAP: skipped (success)
 *        - status = false      -> never posted to SAP, nothing to reverse: skipped (success)
 *        - status = true       -> continue
 *   2. order_conf: row with fg_batch = spool_id (latest, not already cancelled)
 *        gives confrmation_no and confirmation_counter
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
 * Cancel the SAP confirmation of a spool's FG transaction.
 * @param {string} rawSpoolId
 * @returns {Promise<{
 *   success: boolean, skipped: boolean, message: string, spool_id: string,
 *   payload?: object, sap_response?: object
 * }>}
 */
export const reverseDrawInSAP = async (rawSpoolId, db = pool) => {
    const spoolId = normalizeSpoolId(rawSpoolId);

    // 1) FG transaction of this spool
    const txnRes = await db.query(
        `SELECT transaction_id, status
           FROM transactions
          WHERE fg_batch = $1
            AND "type" = 'FG'
          ORDER BY transaction_id DESC
          LIMIT 1`,
        [spoolId]
    );

    if (txnRes.rows.length === 0 || txnRes.rows[0].status !== true) {
        return {
            success: true,
            skipped: true,
            spool_id: spoolId,
            message:
                txnRes.rows.length === 0
                    ? "No FG transaction found for this spool. SAP reversal skipped."
                    : "FG transaction was not posted to SAP (status = false). SAP reversal skipped.",
        };
    }

    // 2) confirmation details
    const confRes = await db.query(
        `SELECT order_no, confrmation_no, confirmation_counter
           FROM order_conf
          WHERE fg_batch = $1
            AND COALESCE(cancelling_flag, false) = false
          ORDER BY order_conf_id DESC
          LIMIT 1`,
        [spoolId]
    );
    const conf = confRes.rows[0];
    if (!conf || conf.confrmation_no == null || conf.confirmation_counter == null) {
        const err = new Error(
            "FG transaction is posted to SAP but no confirmation (order_conf) was found for this spool."
        );
        err.code = "VALIDATION";
        throw err;
    }

    const payload = {
        ConfirmationCount: padNum(conf.confirmation_counter, 8),
        ConfirmationGroup: padNum(conf.confrmation_no, 10),
    };

    // 3) call SAP
    const endpoint = CANCEL_ENDPOINT();
    const url = buildSapUrl(endpoint);
    const startedAt = Date.now();
    console.log("[Draw Reversal SAP] POST URL:", url, payload);

    let result;
    try {
        result = await postWithAuth(url, payload);
    } catch (httpError) {
        const upstream = httpError.response?.data;
        const msg = upstream?.Message || upstream?.message || httpError.message;
        await logSapCall({
            operation: "DRAW_REVERSAL_CANCEL_CONFIRMATION",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: msg,
            reference_type: "SPOOL",
            reference_id: spoolId,
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
        operation: "DRAW_REVERSAL_CANCEL_CONFIRMATION",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        http_status_code: result.httpStatus,
        message: sapResponse?.Message || sapResponse?.message,
        reference_type: "SPOOL",
        reference_id: spoolId,
        request_payload: payload,
        response_payload: sapResponse,
        duration_ms: Date.now() - startedAt,
    });

    // 4) hand SAP's reply back for the next transaction
    return {
        success: true,
        skipped: false,
        spool_id: spoolId,
        message: sapResponse?.Message || "SAP confirmation cancelled",
        payload,
        sap_response: sapResponse,
    };
};

export default reverseDrawEntry;
