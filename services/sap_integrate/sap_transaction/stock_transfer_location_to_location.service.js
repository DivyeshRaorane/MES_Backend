import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Stock Transfer — Storage Location to Storage Location (movement type 311) Service
 *
 * Reusable helper to post a storage-location-to-storage-location stock transfer
 * to SAP:
 *
 *   POST {SAP_BASE_URL}/stock-transfer-from-storageloc-to-storagelocation
 *
 * Payload shape (single or bulk items in `to_MaterialDocumentItem`):
 *   {
 *     "GoodsMovementCode": "04",
 *     "PostingDate": "/Date(1787443200000)/",
 *     "DocumentDate": "/Date(1787443200000)/",
 *     "MaterialDocumentHeaderText": "Test 311 mvt",
 *     "to_MaterialDocumentItem": [
 *       {
 *         "Material": "1000000004",
 *         "Plant": "1200",
 *         "StorageLocation": "1201",
 *         "Batch": "0000000574",
 *         "GoodsMovementType": "311",
 *         "IssuingOrReceivingPlant": "1200",
 *         "IssuingOrReceivingStorageLoc": "1201",
 *         "QuantityInEntryUnit": "100",
 *         "EntryUnit": "KG"
 *       }
 *     ]
 *   }
 *
 * Success response (SAP wraps result under `Data`, StatusCode 201):
 *   {
 *     "Message": "...created successfully",
 *     "StatusCode": 201,
 *     "Data": { "MaterialDocument": "4900003156", "MaterialDocumentYear": "2026", ... }
 *   }
 *
 * Exposes:
 *   - postStockTransferLocationToLocation(items, options)  single or bulk
 */

/* ── URL + env helpers ─────────────────────────────────────── */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const STOCK_TRANSFER_LTL_URL = () =>
    buildSapUrl(
        process.env.SAP_STOCK_TRANSFER_LTL_ENDPOINT ||
            "stock-transfer-from-storageloc-to-storagelocation"
    );

const PLANT = () => process.env.SAP_TXN_PLANT || "1200";
const STORAGE_LOCATION = () => process.env.SAP_TXN_STORAGE_LOCATION || "1201";
const MOVEMENT_TYPE = () => process.env.SAP_STOCK_TRANSFER_LTL_MOVEMENT_TYPE || "311";
const GOODS_MOVEMENT_CODE = () => process.env.SAP_STOCK_TRANSFER_LTL_GOODS_MOVEMENT_CODE || "04";
const ENTRY_UNIT = () => process.env.SAP_STOCK_TRANSFER_LTL_ENTRY_UNIT || "KG";

/* ── value helpers ─────────────────────────────────────────── */

// Convert a value to a plain string (SAP payloads use strings); null stays null.
const str = (v) => (v === undefined || v === null ? null : String(v));

// SAP OData date: /Date(<epoch ms>)/ for a given JS Date (defaults now).
const sapDate = (d = new Date()) => {
    const date = d instanceof Date ? d : new Date(d);
    return `/Date(${date.getTime()})/`;
};

/* ── POST with bearer token (re-login once on 401) ─────────── */

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
        return response.data ?? {};
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
            return response.data ?? {};
        }
        throw error;
    }
};

/* ── payload building ──────────────────────────────────────── */

/**
 * Build a single `to_MaterialDocumentItem` entry from a caller-supplied item.
 * Falls back to env defaults for plant / storage location / movement type /
 * entry unit when the caller does not provide them.
 *
 * @param {object} item
 * @param {string} item.material          Material being transferred
 * @param {string} item.batch             Batch of the material
 * @param {number|string} item.quantity   Quantity in entry unit
 * @param {string} [item.plant]           Issuing plant. Defaults to SAP_TXN_PLANT
 * @param {string} [item.storageLocation] Issuing storage location. Defaults to SAP_TXN_STORAGE_LOCATION
 * @param {string} [item.receivingPlant]  Receiving plant. Defaults to issuing plant
 * @param {string} [item.receivingStorageLocation] Receiving storage location (required target)
 * @param {string} [item.goodsMovementType] Defaults to SAP_STOCK_TRANSFER_LTL_MOVEMENT_TYPE
 * @param {string} [item.entryUnit]       Defaults to SAP_STOCK_TRANSFER_LTL_ENTRY_UNIT
 */
const buildTransferItem = (item) => {
    if (!item || typeof item !== "object") {
        throw new Error("stock transfer item must be an object");
    }

    const material = str(item.material ?? item.Material);
    const batch = str(item.batch ?? item.Batch);
    const quantity = str(item.quantity ?? item.QuantityInEntryUnit);

    const plant = str(item.plant ?? item.Plant) || PLANT();
    const storageLocation = str(item.storageLocation ?? item.StorageLocation) || STORAGE_LOCATION();

    // Receiving side: fall back to the issuing plant when not specified.
    const receivingPlant = str(item.receivingPlant ?? item.IssuingOrReceivingPlant) || plant;
    const receivingStorageLocation = str(
        item.receivingStorageLocation ?? item.IssuingOrReceivingStorageLoc
    );

    if (!material) throw new Error("stock transfer item requires `material`");
    if (quantity === null || quantity === "") throw new Error("stock transfer item requires `quantity`");
    if (!receivingStorageLocation) {
        throw new Error("stock transfer item requires `receivingStorageLocation`");
    }

    return {
        Material: material,
        Plant: plant,
        StorageLocation: storageLocation,
        Batch: batch,
        GoodsMovementType: str(item.goodsMovementType ?? item.GoodsMovementType) || MOVEMENT_TYPE(),
        IssuingOrReceivingPlant: receivingPlant,
        IssuingOrReceivingStorageLoc: receivingStorageLocation,
        QuantityInEntryUnit: quantity,
        EntryUnit: str(item.entryUnit ?? item.EntryUnit) || ENTRY_UNIT(),
    };
};

/**
 * Build the full stock-transfer payload from one item or an array of items.
 *
 * @param {object|object[]} items         a single item or a list of items (bulk)
 * @param {object} [options]
 * @param {Date|number|string} [options.postingDate] posting date (defaults now)
 * @param {Date|number|string} [options.documentDate] document date (defaults now)
 * @param {string} [options.headerText]   MaterialDocumentHeaderText
 * @param {string} [options.goodsMovementCode] defaults to env / "04"
 */
export const buildStockTransferPayload = (items, options = {}) => {
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) {
        throw new Error("stock transfer requires at least one item");
    }

    const now = new Date();

    return {
        GoodsMovementCode: str(options.goodsMovementCode) || GOODS_MOVEMENT_CODE(),
        PostingDate: sapDate(options.postingDate ?? now),
        DocumentDate: sapDate(options.documentDate ?? now),
        MaterialDocumentHeaderText: str(options.headerText) || "MES",
        to_MaterialDocumentItem: list.map(buildTransferItem),
    };
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Post a storage-location-to-storage-location stock transfer (movement type
 * 311) to SAP.
 *
 * Accepts a single item or an array of items (bulk). Each item is transformed
 * into one `to_MaterialDocumentItem`.
 *
 * @param {object|object[]} items   single item or list of items (bulk)
 * @param {object} [options]        header overrides (see buildStockTransferPayload)
 * @returns {Promise<object>} { success, statusCode, message, materialDocument,
 *                              materialDocumentYear, payload, sap_response }
 */
export const postStockTransferLocationToLocation = async (items, options = {}) => {
    const payload = buildStockTransferPayload(items, options);
    const url = STOCK_TRANSFER_LTL_URL();
    // Optional correlation / source metadata for the log (passed by batch runners).
    const logContext = options.logContext || {};

    console.log("[SAP-POST][STOCK-TRANSFER-LTL] URL:", url);
    console.log("[SAP-POST][STOCK-TRANSFER-LTL] Payload:", JSON.stringify(payload));

    const firstBatch = payload.to_MaterialDocumentItem?.[0]?.Batch ?? null;
    const firstMaterial = payload.to_MaterialDocumentItem?.[0]?.Material ?? null;

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "STOCK_TRANSFER_LTL",
            status: "FAILED",
            sap_endpoint:
                process.env.SAP_STOCK_TRANSFER_LTL_ENDPOINT ||
                "stock-transfer-from-storageloc-to-storagelocation",
            sap_url: url,
            movement_type: MOVEMENT_TYPE(),
            http_status_code: httpError.response?.status,
            message: httpError.message,
            material_code: firstMaterial,
            batch: firstBatch,
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
            ...logContext,
        });
        throw httpError;
    }

    const durationMs = Date.now() - startedAt;
    const statusCode = Number(response?.StatusCode);
    const data = response?.Data || {};
    const success = statusCode === 201 || statusCode === 200 || Boolean(data.MaterialDocument);

    if (!success) {
        const detail = response?.Message || "no success status returned";
        await logSapCall({
            operation: "STOCK_TRANSFER_LTL",
            status: "FAILED",
            sap_endpoint:
                process.env.SAP_STOCK_TRANSFER_LTL_ENDPOINT ||
                "stock-transfer-from-storageloc-to-storagelocation",
            sap_url: url,
            movement_type: MOVEMENT_TYPE(),
            http_status_code: statusCode || null,
            message: detail,
            material_code: firstMaterial,
            batch: firstBatch,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
            ...logContext,
        });
        throw new Error(`Stock transfer location-to-location not successful: ${detail}`);
    }

    await logSapCall({
        operation: "STOCK_TRANSFER_LTL",
        status: "SUCCESS",
        sap_endpoint:
            process.env.SAP_STOCK_TRANSFER_LTL_ENDPOINT ||
            "stock-transfer-from-storageloc-to-storagelocation",
        sap_url: url,
        movement_type: MOVEMENT_TYPE(),
        http_status_code: statusCode || null,
        message: response?.Message ?? null,
        material_document: data.MaterialDocument ?? null,
        material_code: firstMaterial,
        batch: firstBatch,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
        ...logContext,
    });

    return {
        success: true,
        statusCode,
        message: response?.Message ?? null,
        materialDocument: data.MaterialDocument ?? null,
        materialDocumentYear: data.MaterialDocumentYear ?? null,
        payload,
        sap_response: response,
    };
};

/* ══════════════════════════════════════════════════════════
   stock_transfer table -> SAP 311 transfer (batch runner)
   ══════════════════════════════════════════════════════════

   stock_transfer rows queue storage-location-to-storage-location movements.
   Each pending row (transfer = false) becomes one 311 transfer item:

       Material                     <- material_code
       Plant / StorageLocation      <- plant / storage_location
       Batch                        <- batch
       IssuingOrReceivingPlant      <- receiving_plant
       IssuingOrReceivingStorageLoc <- receiving_storage_location
       QuantityInEntryUnit          <- qty
       EntryUnit                    <- uom

   On SAP success the posted rows are flagged transfer = true so they are not
   posted again. Plant / storage location / uom fall back to the poster's env
   defaults when a row leaves them null.
*/

/**
 * Fetch stock_transfer rows still pending a movement (transfer = false).
 *
 * @param {number} [limit]  optional cap on how many rows to pull in one run
 * @returns {Promise<Array<object>>} pending stock_transfer rows
 */
export const fetchPendingStockTransfers = async (limit = null) => {
    const params = [];
    let sql = `
        SELECT stock_transfer_id, material_code, plant, storage_location, batch,
               receiving_plant, receiving_storage_location, qty, uom
          FROM stock_transfer
         WHERE COALESCE(transfer, false) = false
           AND material_code IS NOT NULL
           AND receiving_storage_location IS NOT NULL
           AND qty IS NOT NULL
         ORDER BY stock_transfer_id ASC`;
    if (Number.isInteger(limit) && limit > 0) {
        params.push(limit);
        sql += `\n         LIMIT $${params.length}`;
    }
    const result = await pool.query(sql, params);
    return result.rows;
};

/**
 * Mark stock_transfer rows as transferred (transfer = true) after a successful
 * SAP post.
 *
 * @param {number[]} ids  stock_transfer_id values
 * @param {object} [client]  optional pg client (defaults to the shared pool)
 * @returns {Promise<number>} number of rows updated
 */
export const markStockTransfersDone = async (ids, client = pool) => {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const result = await client.query(
        `UPDATE stock_transfer
            SET transfer = true, updated_at = current_timestamp
          WHERE stock_transfer_id = ANY($1::int[])`,
        [ids]
    );
    return result.rowCount || 0;
};

/**
 * Turn a stock_transfer row into a location-to-location (311) transfer item.
 *
 * @param {object} row  a stock_transfer row
 * @returns {object} transfer item consumed by buildTransferItem
 */
const stockTransferRowToItem = (row) => ({
    material: row.material_code,
    plant: row.plant,
    storageLocation: row.storage_location,
    batch: row.batch,
    receivingPlant: row.receiving_plant,
    receivingStorageLocation: row.receiving_storage_location,
    quantity: row.qty,
    entryUnit: row.uom,
});

/**
 * Post all pending stock_transfer rows to SAP as location-to-location (311)
 * transfers, ONE ROW AT A TIME in FIFO order (oldest stock_transfer_id first).
 *
 * Each pending row is its own SAP call and produces its own material document.
 * On success that row is flagged transfer = true immediately. Rows are handled
 * independently: one failure never blocks the rows behind it, and failed rows
 * stay pending so the next run retries them.
 *
 * @param {object} [options]
 * @param {number} [options.limit]  optional cap on rows per run
 * @returns {Promise<{
 *   total: number,
 *   posted: number,
 *   failed: number,
 *   results: object[],
 *   errors: object[]
 * }>}
 */
export const postPendingStockTransfers = async ({ limit = null } = {}) => {
    const rows = await fetchPendingStockTransfers(limit);

    const summary = {
        total: rows.length,
        posted: 0,
        failed: 0,
        results: [],
        errors: [],
    };

    if (rows.length === 0) return summary;

    // Process strictly in FIFO order, one row -> one SAP call.
    for (const row of rows) {
        const item = stockTransferRowToItem(row);
        try {
            const result = await postStockTransferLocationToLocation(item, {
                headerText: "MES",
                logContext: {
                    source_table: "stock_transfer",
                    source_ids: [row.stock_transfer_id],
                    reference_type: "STOCK_TRANSFER",
                },
            });

            await markStockTransfersDone([row.stock_transfer_id]);

            summary.posted += 1;
            summary.results.push({
                stock_transfer_id: row.stock_transfer_id,
                material_code: row.material_code,
                batch: row.batch,
                material_document: result.materialDocument,
            });
        } catch (error) {
            summary.failed += 1;
            summary.errors.push({
                stock_transfer_id: row.stock_transfer_id,
                material_code: row.material_code,
                batch: row.batch,
                message: error.message,
                http_status: error.response?.status,
                sap_response: error.response?.data,
            });
            console.error(
                `[SAP-POST][STOCK-TRANSFER-LTL] Failed for stock_transfer ${row.stock_transfer_id}:`,
                error.message
            );
        }
    }

    return summary;
};

export default postStockTransferLocationToLocation;
