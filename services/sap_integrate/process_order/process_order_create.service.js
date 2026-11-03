import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Process Order create + release.
 *
 * POST SAP_BASE_URL + "production-order-create-release"
 * Request:
 *   {
 *     "ManufacturingOrderType": "ZSFG",
 *     "Material": "DTG652D250",
 *     "ProductionPlant": "1200",
 *     "TotalQuantity": "50",
 *     "ProductionUnit": "KM",
 *     "BasicSchedulingType": "4"
 *   }
 * Response:
 *   {
 *     "Message": "Production Order created and released successfully",
 *     "StatusCode": 200,
 *     "Data": {
 *       "ManufacturingOrder": "1210000193",
 *       "ReleaseOrder": { "SystemMessageType": "I", "SystemMessageLongText": "...", ... }
 *     }
 *   }
 *
 * Before the call a SAP bearer token is obtained from the SAP login API
 * (sap_auth.service.js, cached; a 401 forces a fresh login and one retry).
 * On success the order number is saved in process_order_create with
 * created_by (emp_id from the MES JWT) and created_at.
 */

const ENDPOINT = "production-order-create-release";

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${endpoint}`;
};

// SAP scheduling types (OPU3): 1 Backwards, 2 Backwards in time, 3 Current date,
// 4 Forwards, 5 Forwards in time, 6 Only capacity requirements.
const VALID_SCHEDULING_TYPES = ["1", "2", "3", "4", "5", "6"];

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
            // Token expired/invalid -> log in to SAP again and retry once.
            clearSapToken();
            const response = await send(true);
            return response.data || {};
        }
        throw error;
    }
};

const trimStr = (v) => (v === undefined || v === null ? "" : String(v).trim());

/**
 * Validate and normalize the frontend body into the SAP payload.
 * Throws an error with code "VALIDATION" when invalid.
 */
export const buildCreatePayload = (body = {}) => {
    const payload = {
        ManufacturingOrderType: trimStr(body.ManufacturingOrderType).toUpperCase(),
        Material: trimStr(body.Material).toUpperCase(),
        ProductionPlant: trimStr(body.ProductionPlant),
        TotalQuantity: trimStr(body.TotalQuantity),
        ProductionUnit: trimStr(body.ProductionUnit).toUpperCase(),
        BasicSchedulingType: trimStr(body.BasicSchedulingType),
    };

    const errors = [];
    if (!payload.ManufacturingOrderType) errors.push("ManufacturingOrderType is required");
    else if (payload.ManufacturingOrderType.length > 4) errors.push("ManufacturingOrderType must be 4 characters or fewer");

    if (!payload.Material) errors.push("Material is required");
    else if (payload.Material.length > 40) errors.push("Material must be 40 characters or fewer");

    if (!payload.ProductionPlant) errors.push("ProductionPlant is required");
    else if (payload.ProductionPlant.length > 4) errors.push("ProductionPlant must be 4 characters or fewer");

    const qty = Number(payload.TotalQuantity);
    if (!payload.TotalQuantity) errors.push("TotalQuantity is required");
    else if (!Number.isFinite(qty) || qty <= 0) errors.push("TotalQuantity must be a number greater than 0");

    if (!payload.ProductionUnit) errors.push("ProductionUnit is required");
    else if (payload.ProductionUnit.length > 3) errors.push("ProductionUnit must be 3 characters or fewer");

    if (!payload.BasicSchedulingType) errors.push("BasicSchedulingType is required");
    else if (!VALID_SCHEDULING_TYPES.includes(payload.BasicSchedulingType)) {
        errors.push(`BasicSchedulingType must be one of ${VALID_SCHEDULING_TYPES.join(", ")}`);
    }

    if (errors.length) {
        const err = new Error(errors.join("; "));
        err.code = "VALIDATION";
        err.errors = errors;
        throw err;
    }

    return payload;
};

/** Save the created order number. */
const saveCreatedOrder = async (processOrderNo, createdBy) => {
    const result = await pool.query(
        `INSERT INTO process_order_create (process_order_no, created_by, created_at)
         VALUES ($1, $2, now())
         RETURNING id, process_order_no, created_by, created_at`,
        [processOrderNo, createdBy ?? null]
    );
    return result.rows[0];
};

/**
 * Create and release a process order in SAP, then save it locally.
 * @param {object} body       frontend payload
 * @param {string} createdBy  emp_id from the MES JWT
 * @returns {{ order_no, message, release, saved, db_error, sap_response }}
 */
export const createProcessOrderInSAP = async (body, createdBy) => {
    const payload = buildCreatePayload(body);
    const url = buildSapUrl(ENDPOINT);
    const startedAt = Date.now();

    console.log("[Process Order Create] POST URL:", url);
    console.log("[Process Order Create] Request payload:", payload);

    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        const upstream = httpError.response?.data;
        const msg = upstream?.Message || upstream?.message || httpError.message;
        await logSapCall({
            operation: "CREATE_ORDER",
            status: "FAILED",
            sap_endpoint: ENDPOINT,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: msg,
            reference_type: "MATERIAL",
            reference_id: payload.Material,
            request_payload: payload,
            response_payload: upstream,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        const err = new Error(msg);
        err.code = "SAP_HTTP_ERROR";
        err.status = httpError.response?.status;
        err.sap_response = upstream ?? null;
        throw err;
    }

    console.log("[Process Order Create] RESPONSE:", JSON.stringify(response, null, 2));

    const data = response?.Data || {};
    const statusCode = Number(response?.StatusCode) || null;
    const orderNo = data.ManufacturingOrder ? String(data.ManufacturingOrder) : null;
    const release = data.ReleaseOrder || {};
    const releaseType = release.SystemMessageType || null; // I/S = ok, E/A = error, W = warning
    const releaseText = release.SystemMessageLongText || null;

    // The order exists in SAP as soon as an order number comes back.
    const success = Boolean(orderNo);

    await logSapCall({
        operation: "CREATE_ORDER",
        status: success ? "SUCCESS" : "FAILED",
        sap_endpoint: ENDPOINT,
        sap_url: url,
        http_status_code: statusCode,
        sap_status: releaseType,
        message: response?.Message || releaseText || null,
        reference_type: "MATERIAL",
        reference_id: orderNo || payload.Material,
        request_payload: payload,
        response_payload: response,
        duration_ms: Date.now() - startedAt,
    });

    if (!success) {
        const err = new Error(response?.Message || "SAP did not return a ManufacturingOrder number");
        err.code = "SAP_REJECTED";
        err.sap_response = response;
        throw err;
    }

    // The order is already in SAP, so a DB failure must not hide the order
    // number from the user. Report it alongside the success instead.
    let saved = null;
    let dbError = null;
    try {
        saved = await saveCreatedOrder(orderNo, createdBy);
    } catch (e) {
        console.error("[Process Order Create] DB insert failed for order", orderNo, e);
        dbError = e.message;
    }

    return {
        order_no: orderNo,
        message: response?.Message || "Production Order created",
        release: {
            type: releaseType,
            text: releaseText,
            released: releaseType !== "E" && releaseType !== "A",
        },
        saved,
        db_error: dbError,
        sap_response: response,
    };
};
