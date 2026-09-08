import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall, newCorrelationId } from "../sap_log.service.js";

// Build the full endpoint from the SAP base URL (handles trailing slash safely)
const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${endpoint}`;
};

const SAP_URL = buildSapUrl("material-stock");

// Only stock rows from this storage location are inserted into preform_data.
const ALLOWED_STORAGE_LOCATION = process.env.SAP_MATERIAL_STOCK_STORAGE_LOCATION || "1204";

// Only stock rows with this unit of measure are inserted into preform_data.
const ALLOWED_UOM = process.env.SAP_MATERIAL_STOCK_UOM || "KG";

/**
 * Strip leading zeros so a SAP material like "000000001000000004"
 * or "1000000004" both match material_master.material_code = "1000000004".
 */
const normalizeMaterialCode = (material) => {
    if (material === null || material === undefined) return material;
    const trimmed = String(material).trim();
    const stripped = trimmed.replace(/^0+/, "");
    return stripped.length ? stripped : "0";
};

/**
 * Build the list of Materials to request from SAP.
 * Accepts an explicit list (from an API caller) or falls back to .env.
 */
const buildMaterialPayload = (materials) => {
    let list = materials;

    if (!list || (Array.isArray(list) && list.length === 0)) {
        list = (process.env.SAP_MATERIAL_STOCK_MATERIALS || "")
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);
    }

    if (typeof list === "string") {
        list = list.split(",").map((m) => m.trim()).filter(Boolean);
    }

    const plant = process.env.SAP_MATERIAL_STOCK_PLANT || "1200";
    const inventoryStockType = process.env.SAP_MATERIAL_STOCK_INVENTORY_STOCK_TYPE || "01";

    return list.map((material) => ({
        Material: material,
        Plant: plant,
        Customer: "",
        Supplier: "",
        InventoryStockType: inventoryStockType,
    }));
};

/**
 * Call the SAP material-stock POST API and return the flat array of stock rows.
 * SAP is called once per Material entry in the payload; results are merged.
 */
const fetchMaterialStockFromSAP = async (materials) => {
    const payloads = buildMaterialPayload(materials);

    if (payloads.length === 0) {
        throw new Error("No Material provided and none configured in SAP_MATERIAL_STOCK_MATERIALS");
    }

    const allRows = [];
    // One correlation id for this whole sync run (all Material fetches).
    const correlationId = newCorrelationId();

    for (const payload of payloads) {
        const startedAt = Date.now();
        let body;
        try {
            body = await postWithAuth(SAP_URL, payload);
        } catch (httpError) {
            await logSapCall({
                operation: "MATERIAL_STOCK",
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

        const rows = Array.isArray(body.Data) ? body.Data : [];
        allRows.push(...rows);

        await logSapCall({
            operation: "MATERIAL_STOCK",
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
    }

    return allRows;
};

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
            // Token likely expired/invalid -> force a fresh login and retry once.
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
 * Look up preform_type / product_type / material_description for a set of
 * (normalized) material codes from material_master. Returns a Map keyed by code.
 */
const getMaterialMasterMap = async (materialCodes) => {
    const map = new Map();
    if (materialCodes.length === 0) return map;

    const result = await pool.query(
        `SELECT material_code, material_description, preform_type, product_type
         FROM material_master
         WHERE material_code = ANY($1::text[])`,
        [materialCodes]
    );

    for (const row of result.rows) {
        map.set(String(row.material_code), row);
    }
    return map;
};

/**
 * Return the set of preform_ids (batches) that already exist in preform_data,
 * limited to the batches we are about to consider.
 */
const getExistingPreformIds = async (batches) => {
    const set = new Set();
    if (batches.length === 0) return set;

    const result = await pool.query(
        `SELECT preform_id FROM preform_data WHERE preform_id = ANY($1::text[])`,
        [batches]
    );

    for (const row of result.rows) {
        set.add(String(row.preform_id));
    }
    return set;
};

/**
 * Core sync:
 *  1. Fetch stock rows from SAP.
 *  2. Drop batches (preform_id) that already exist in preform_data.
 *  3. Enrich each new batch with preform_type / product_type from material_master.
 *  4. Insert the new rows into preform_data (one transaction).
 */
export const syncMaterialStock = async (materials) => {
    const stockRows = await fetchMaterialStockFromSAP(materials);
    

    const summary = {
        fetched: stockRows.length,
        inserted: 0,
        skipped_existing: 0,
        skipped_no_master: 0,
        skipped_duplicate_in_batch: 0,
        skipped_storage_location: 0,
        skipped_uom: 0,
        inserted_ids: [],
        missing_material_codes: [],
    };

    if (stockRows.length === 0) return summary;

    // Unique batches present in the SAP response
    const batchesInResponse = [...new Set(
        stockRows.map((r) => String(r.Batch)).filter(Boolean)
    )];

    const existingIds = await getExistingPreformIds(batchesInResponse);

    // Normalized material codes we need to resolve from material_master
    const neededCodes = [...new Set(
        stockRows.map((r) => normalizeMaterialCode(r.Material)).filter(Boolean)
    )];
    const masterMap = await getMaterialMasterMap(neededCodes);

    // Track batches already handled within this run so we don't insert a
    // duplicate preform_id twice (same batch across storage locations).
    const seenInThisRun = new Set();
    const missingCodes = new Set();

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const row of stockRows) {
            const batch = row.Batch ? String(row.Batch) : null;
            if (!batch) continue;

            // Only insert rows from the allowed storage location (e.g. 1204).
            if (String(row.StorageLocation ?? "").trim() !== ALLOWED_STORAGE_LOCATION) {
                summary.skipped_storage_location += 1;
                continue;
            }

            // Only insert rows with the allowed unit of measure (e.g. KG).
            if (String(row.MaterialBaseUnit ?? "").trim().toUpperCase() !== ALLOWED_UOM.toUpperCase()) {
                summary.skipped_uom += 1;
                continue;
            }

            // Already in DB -> skip
            if (existingIds.has(batch)) {
                summary.skipped_existing += 1;
                continue;
            }

            // Already inserted earlier in this same run -> skip duplicate
            if (seenInThisRun.has(batch)) {
                summary.skipped_duplicate_in_batch += 1;
                continue;
            }

            const code = normalizeMaterialCode(row.Material);
            const master = masterMap.get(code);

            // No matching material in material_master -> cannot resolve type -> skip
            if (!master) {
                summary.skipped_no_master += 1;
                missingCodes.add(code);
                continue;
            }

            await client.query(
                `INSERT INTO preform_data (
                    preform_id,
                    preform_weight,
                    preform_type,
                    product_type,
                    material_code,
                    material_description,
                    plant,
                    storage_location,
                    uom,
                    is_active
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
                ON CONFLICT (preform_id) DO NOTHING`,
                [
                    batch,
                    row.MatlWrhsStkQtyInMatlBaseUnit || null,
                    master.preform_type,
                    master.product_type,
                    code,
                    master.material_description,
                    row.Plant || null,
                    row.StorageLocation || null,
                    row.MaterialBaseUnit || "KG",
                ]
            );

            seenInThisRun.add(batch);
            summary.inserted += 1;
            summary.inserted_ids.push(batch);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    summary.missing_material_codes = [...missingCodes];
    return summary;
};
