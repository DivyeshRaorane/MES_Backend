import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";
import { resyncOrderFromSAP } from "./process_order_resync.service.js";

/**
 * SAP Process Order quantity change.
 *
 * POST SAP_BASE_URL + "production-order-qty-change?ManufacturingOrder=<12-digit order>"
 * Body: { "TotalQuantity": "150.000" }
 *
 * Success:
 *   { "Message": "Production Order quantity updated successfully", "StatusCode": 200,
 *     "Data": { "ManufacturingOrder": "1210000189", "PreviousQuantity": "190.000",
 *               "TotalQuantity": "200.000", "StatusCode": 204, "Status": "Success" } }
 * Error (may come as HTTP 200 or 4xx):
 *   { "Message": "System status TECO is active (ORD 1210000193)", "StatusCode": 400, "Data": [] }
 *
 * A SAP bearer token is obtained from the SAP login API first (cached; a 401
 * forces a fresh login and one retry). On success the matching row in
 * process_order_create is updated: the change is appended to note.qty_changes,
 * updated_by = emp_id from the token, updated_at = now().
 */

const ENDPOINT = "production-order-qty-change";

const buildSapUrl = (path) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${path}`;
};

const SAP_TIMEOUT_MS = Number(process.env.SAP_REQUEST_TIMEOUT_MS) || 30000;

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
        return response.data || {};
    } catch (error) {
        if (error.response?.status === 401) {
            clearSapToken();
            const response = await send(true);
            return response.data || {};
        }
        throw error;
    }
};

const validationError = (message) => {
    const err = new Error(message);
    err.code = "VALIDATION";
    return err;
};

/**
 * Validate input. Returns:
 *   sapOrderNo  12-digit, zero-padded (what SAP expects in the URL)
 *   orderNo     without leading zeros (how it is stored in process_order_create)
 *   quantity    "150.000" (3 decimals, as SAP expects)
 */
export const normalizeQtyChangeInput = (rawOrderNo, rawQty) => {
    const trimmed = rawOrderNo === undefined || rawOrderNo === null ? "" : String(rawOrderNo).trim();
    if (!/^\d{1,12}$/.test(trimmed)) {
        throw validationError("Order number is required and must contain only digits (max 12)");
    }
    const orderNo = trimmed.replace(/^0+/, "") || "0";
    const sapOrderNo = orderNo.padStart(12, "0");

    const qtyStr = rawQty === undefined || rawQty === null ? "" : String(rawQty).trim();
    const qty = Number(qtyStr);
    if (!qtyStr) throw validationError("TotalQuantity is required");
    if (!Number.isFinite(qty) || qty <= 0) throw validationError("TotalQuantity must be a number greater than 0");
    if (!/^\d+(\.\d{1,3})?$/.test(qtyStr)) throw validationError("TotalQuantity can have at most 3 decimal places");

    return { orderNo, sapOrderNo, quantity: qty.toFixed(3) };
};

/** Append the change to note.qty_changes and stamp updated_by / updated_at. */
const recordQtyChange = async (orderNo, change, updatedBy) => {
    const result = await pool.query(
        `UPDATE process_order_create
            SET note = (
                    COALESCE(note::jsonb, '{}'::jsonb)
                    || jsonb_build_object(
                           'qty_changes',
                           COALESCE(note::jsonb -> 'qty_changes', '[]'::jsonb) || jsonb_build_array($2::jsonb)
                       )
                )::json,
                updated_by = $3,
                updated_at = now()
          WHERE process_order_no = $1
        RETURNING id, process_order_no, created_by, note, created_at, updated_by, updated_at`,
        [orderNo, JSON.stringify(change), updatedBy ?? null]
    );
    return result.rows[0] || null;
};

/**
 * Change a process order's total quantity in SAP, then record it locally.
 * @param {string} rawOrderNo
 * @param {string|number} rawQty
 * @param {string} updatedBy  emp_id from the MES JWT
 */
export const changeProcessOrderQtyInSAP = async (rawOrderNo, rawQty, updatedBy) => {
    const { orderNo, sapOrderNo, quantity } = normalizeQtyChangeInput(rawOrderNo, rawQty);
    const url = buildSapUrl(`${ENDPOINT}?ManufacturingOrder=${encodeURIComponent(sapOrderNo)}`);
    const payload = { TotalQuantity: quantity };
    const startedAt = Date.now();

    console.log("[Process Order Qty Change] POST URL:", url);
    console.log("[Process Order Qty Change] Request payload:", payload);

    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        const upstream = httpError.response?.data;
        const msg = upstream?.Message || upstream?.message || httpError.message;
        await logSapCall({
            operation: "ORDER_QTY_CHANGE",
            status: "FAILED",
            sap_endpoint: ENDPOINT,
            sap_url: url,
            http_status_code: Number(upstream?.StatusCode) || httpError.response?.status,
            message: msg,
            reference_type: "PROCESS_ORDER",
            reference_id: orderNo,
            request_payload: payload,
            response_payload: upstream,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        const err = new Error(msg);
        err.code = "SAP_HTTP_ERROR";
        err.sap_response = upstream ?? null;
        throw err;
    }

    console.log("[Process Order Qty Change] RESPONSE:", JSON.stringify(response, null, 2));

    const statusCode = Number(response?.StatusCode) || null;
    // Data is an object on success and [] on error.
    const data = response?.Data && !Array.isArray(response.Data) ? response.Data : {};
    const success =
        (statusCode === 200 || statusCode === 201 || statusCode === 204) &&
        String(data.Status || "").toLowerCase() === "success";

    await logSapCall({
        operation: "ORDER_QTY_CHANGE",
        status: success ? "SUCCESS" : "FAILED",
        sap_endpoint: ENDPOINT,
        sap_url: url,
        http_status_code: statusCode,
        sap_status: data.Status || null,
        message: response?.Message || null,
        reference_type: "PROCESS_ORDER",
        reference_id: orderNo,
        request_payload: payload,
        response_payload: response,
        duration_ms: Date.now() - startedAt,
    });

    if (!success) {
        const err = new Error(response?.Message || "SAP did not confirm the quantity change");
        err.code = "SAP_REJECTED";
        err.sap_response = response;
        throw err;
    }

    const previousQty = data.PreviousQuantity ?? null;
    const newQty = data.TotalQuantity ?? quantity;
    const change = {
        previous_qty: previousQty,
        new_qty: newQty,
        changed_by: updatedBy ?? null,
        changed_at: new Date().toISOString(),
    };

    // The quantity is already changed in SAP, so a DB problem must not turn this into a failure.
    let updated = null;
    let dbError = null;
    try {
        updated = await recordQtyChange(orderNo, change, updatedBy);
    } catch (e) {
        console.error("[Process Order Qty Change] DB update failed for order", orderNo, e);
        dbError = e.message;
    }

    // Pull the new quantity into order_hdr via the standard SAP sync.
    const sync = await resyncOrderFromSAP(orderNo);

    return {
        order_no: data.ManufacturingOrder ? String(data.ManufacturingOrder) : orderNo,
        message: response?.Message || "Production Order quantity updated",
        previous_qty: previousQty,
        new_qty: newQty,
        updated,
        in_mes_table: Boolean(updated),
        db_error: dbError,
        sync,
        sap_response: response,
    };
};
