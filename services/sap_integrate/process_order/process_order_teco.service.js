import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Process Order TECO (technically complete).
 *
 * POST SAP_BASE_URL + "production-order-teco/<orderNo>"   (no body)
 * Response (trimmed):
 *   {
 *     "Message": "Production Order technically completed (TECO) successfully",
 *     "StatusCode": 200,
 *     "Data": {
 *       "ManufacturingOrder": "1210000193",
 *       "Status": "Success",
 *       "OrderDetails": { ... },
 *       "Data": { "TechlyCmpltOrder": { "SystemMessageType": "I", "SystemMessageLongText": "..." } }
 *     }
 *   }
 *
 * A SAP bearer token is obtained from the SAP login API first (cached; a 401
 * forces a fresh login and one retry). On success the matching row in
 * process_order_create is updated: note gets the TECO details (merged into any
 * existing note), updated_by = emp_id from the token, updated_at = now().
 */

const ENDPOINT = "production-order-teco";

const buildSapUrl = (path) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${path}`;
};

const SAP_TIMEOUT_MS = Number(process.env.SAP_REQUEST_TIMEOUT_MS) || 30000;

const postWithAuth = async (url) => {
    const send = async (forceRefresh) =>
        axios({
            method: "POST",
            url,
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

/** Order number must be 1-12 digits (SAP order numbers are numeric). */
export const normalizeOrderNo = (v) => {
    const orderNo = v === undefined || v === null ? "" : String(v).trim();
    if (!/^\d{1,12}$/.test(orderNo)) {
        const err = new Error("Order number is required and must contain only digits (max 12)");
        err.code = "VALIDATION";
        throw err;
    }
    return orderNo;
};

/**
 * Merge TECO info into process_order_create.note and stamp updated_at.
 * Returns the updated row, or null when the order is not in the table.
 */
const markTecoInTable = async (orderNo, tecoInfo, updatedBy) => {
    const result = await pool.query(
        `UPDATE process_order_create
            SET note = (COALESCE(note::jsonb, '{}'::jsonb) || $2::jsonb)::json,
                updated_by = $3,
                updated_at = now()
          WHERE process_order_no = $1
        RETURNING id, process_order_no, created_by, note, created_at, updated_by, updated_at`,
        [orderNo, JSON.stringify(tecoInfo), updatedBy ?? null]
    );
    return result.rows[0] || null;
};

/**
 * TECO a process order in SAP, then update process_order_create.
 * @param {string} rawOrderNo
 * @param {string} updatedBy  emp_id from the MES JWT
 */
export const tecoProcessOrderInSAP = async (rawOrderNo, updatedBy) => {
    const orderNo = normalizeOrderNo(rawOrderNo);
    const url = buildSapUrl(`${ENDPOINT}/${encodeURIComponent(orderNo)}`);
    const startedAt = Date.now();

    console.log("[Process Order TECO] POST URL:", url);

    let response;
    try {
        response = await postWithAuth(url);
    } catch (httpError) {
        const upstream = httpError.response?.data;
        const msg = upstream?.Message || upstream?.message || httpError.message;
        await logSapCall({
            operation: "TECO_ORDER",
            status: "FAILED",
            sap_endpoint: ENDPOINT,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: msg,
            reference_type: "PROCESS_ORDER",
            reference_id: orderNo,
            request_payload: { order_no: orderNo },
            response_payload: upstream,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        const err = new Error(msg);
        err.code = "SAP_HTTP_ERROR";
        err.sap_response = upstream ?? null;
        throw err;
    }

    console.log("[Process Order TECO] RESPONSE:", JSON.stringify(response, null, 2));

    const data = response?.Data || {};
    const tecoMsg = data?.Data?.TechlyCmpltOrder || {};
    const msgType = tecoMsg.SystemMessageType || null; // I/S ok, W warning, E/A error
    const msgText = tecoMsg.SystemMessageLongText || null;
    const statusCode = Number(response?.StatusCode) || null;

    const success =
        msgType !== "E" &&
        msgType !== "A" &&
        (String(data.Status || "").toLowerCase() === "success" ||
            statusCode === 200 ||
            msgType === "I" ||
            msgType === "S");

    await logSapCall({
        operation: "TECO_ORDER",
        status: success ? "SUCCESS" : "FAILED",
        sap_endpoint: ENDPOINT,
        sap_url: url,
        http_status_code: statusCode,
        sap_status: msgType,
        message: response?.Message || msgText || null,
        reference_type: "PROCESS_ORDER",
        reference_id: orderNo,
        request_payload: { order_no: orderNo },
        response_payload: response,
        duration_ms: Date.now() - startedAt,
    });

    if (!success) {
        const err = new Error(msgText || response?.Message || "SAP did not confirm TECO");
        err.code = "SAP_REJECTED";
        err.sap_response = response;
        throw err;
    }

    const tecoAt = new Date().toISOString();
    const tecoInfo = {
        teco: true,
        teco_by: updatedBy ?? null,
        teco_at: tecoAt,
        teco_message: msgText || response?.Message || null,
    };

    // TECO is already done in SAP, so a DB problem must not turn this into a failure.
    let updated = null;
    let dbError = null;
    try {
        updated = await markTecoInTable(orderNo, tecoInfo, updatedBy);
    } catch (e) {
        console.error("[Process Order TECO] DB update failed for order", orderNo, e);
        dbError = e.message;
    }

    return {
        order_no: orderNo,
        message: response?.Message || "Production Order technically completed",
        teco: { type: msgType, text: msgText },
        order_details: data.OrderDetails
            ? {
                  material: data.OrderDetails.Material ?? null,
                  order_type: data.OrderDetails.ManufacturingOrderType ?? null,
                  plant: data.OrderDetails.ProductionPlant ?? null,
                  total_quantity: data.OrderDetails.TotalQuantity ?? null,
                  unit: data.OrderDetails.ProductionUnit ?? null,
                  storage_location: data.OrderDetails.StorageLocation ?? null,
                  confirmed_yield_qty: data.OrderDetails.MfgOrderConfirmedYieldQty ?? null,
              }
            : null,
        updated,
        in_mes_table: Boolean(updated),
        db_error: dbError,
        sap_response: response,
    };
};
