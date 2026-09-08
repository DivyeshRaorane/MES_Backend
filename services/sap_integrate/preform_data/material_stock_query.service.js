import axios from "axios";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall, newCorrelationId } from "../sap_log.service.js";

/**
 * SAP Material Stock QUERY service.
 *
 * Unlike material_stock.service.js (which syncs SAP stock into preform_data),
 * this service only READS stock from SAP and returns the rows to the caller.
 * Nothing is written to the database.
 *
 * Intended use: a user supplies Material + Plant (+ optional InventoryStockType)
 * from the UI and gets back the list of stock rows with all their details.
 */

// Build the full endpoint from the SAP base URL (handles trailing slash safely)
const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${endpoint}`;
};

const SAP_URL = buildSapUrl("material-stock");

// Default plant when the caller does not provide one.
const DEFAULT_PLANT = process.env.SAP_MATERIAL_STOCK_PLANT || "1200";

/**
 * POST to a SAP endpoint with a bearer token. If the token is rejected
 * (401), log in again once and retry.
 */
const postWithAuth = async (url, payload) => {
    try {
        const response = await axios({
            method: "POST",
            url,
            data: payload,
            headers: {
                "Content-Type": "application/json",
                ...(await sapAuthHeader()),
            },
        });
        return response.data || {};
    } catch (error) {
        if (error.response?.status === 401) {
            clearSapToken();
            const response = await axios({
                method: "POST",
                url,
                data: payload,
                headers: {
                    "Content-Type": "application/json",
                    ...(await sapAuthHeader(true)),
                },
            });
            return response.data || {};
        }
        throw error;
    }
};

/**
 * Query SAP for the stock of a single Material.
 *
 * @param {object} params
 * @param {string}  params.material            required
 * @param {string} [params.plant]              defaults to SAP_MATERIAL_STOCK_PLANT / "1200"
 * @param {string} [params.inventoryStockType] optional; sent as "" when omitted
 * @param {string} [params.customer]           optional
 * @param {string} [params.supplier]           optional
 * @returns {Promise<{payload: object, rows: Array, message: string, statusCode: number|null}>}
 */
export const queryMaterialStock = async ({
    material,
    plant,
    inventoryStockType,
    customer = "",
    supplier = "",
} = {}) => {
    const trimmedMaterial = String(material ?? "").trim();
    if (!trimmedMaterial) {
        const err = new Error("Material is required");
        err.statusCode = 400;
        throw err;
    }

    const payload = {
        Material: trimmedMaterial,
        Plant: String(plant ?? "").trim() || DEFAULT_PLANT,
        Customer: String(customer ?? "").trim(),
        Supplier: String(supplier ?? "").trim(),
        // Optional: send "" when the caller doesn't pass a stock type.
        InventoryStockType: String(inventoryStockType ?? "").trim(),
    };

    const correlationId = newCorrelationId();
    const startedAt = Date.now();

    let body;
    try {
        body = await postWithAuth(SAP_URL, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "MATERIAL_STOCK_QUERY",
            status: "FAILED",
            sap_endpoint: "material-stock",
            sap_url: SAP_URL,
            http_status_code: httpError.response?.status,
            message: httpError.message,
            reference_type: "MATERIAL",
            reference_id: payload.Material,
            material_code: payload.Material,
            correlation_id: correlationId,
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }

    const rows = Array.isArray(body?.Data) ? body.Data : [];

    await logSapCall({
        operation: "MATERIAL_STOCK_QUERY",
        status: "SUCCESS",
        sap_endpoint: "material-stock",
        sap_url: SAP_URL,
        http_status_code: Number(body?.StatusCode) || null,
        message: body?.Message ?? `fetched ${rows.length} stock row(s)`,
        reference_type: "MATERIAL",
        reference_id: payload.Material,
        material_code: payload.Material,
        correlation_id: correlationId,
        request_payload: payload,
        response_payload: body,
        duration_ms: Date.now() - startedAt,
    });

    return {
        payload,
        rows,
        message: body?.Message ?? "Material stock data retrieved successfully",
        statusCode: Number(body?.StatusCode) || null,
    };
};

export default queryMaterialStock;
