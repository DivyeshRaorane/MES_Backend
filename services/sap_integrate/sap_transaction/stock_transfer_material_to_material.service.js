import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Stock Transfer — Material to Material (movement type 309) Service
 *
 * Reusable helper to post a material-to-material stock transfer to SAP:
 *
 *   POST {SAP_BASE_URL}/stock-transfer-material-to-material
 *
 * Payload shape (single or bulk items in `to_MaterialDocumentItem`):
 *   {
 *     "GoodsMovementCode": "04",
 *     "PostingDate": "/Date(1787443200000)/",
 *     "DocumentDate": "/Date(1787443200000)/",
 *     "MaterialDocumentHeaderText": "Test 309 mvt",
 *     "to_MaterialDocumentItem": [
 *       {
 *         "Material": "1000000762",
 *         "Plant": "1200",
 *         "StorageLocation": "1201",
 *         "GoodsMovementType": "309",
 *         "Batch": "KWCOLW5071",
 *         "QuantityInEntryUnit": "0.1",
 *         "EntryUnit": "KG",
 *         "IssgOrRcvgMaterial": "1000000767"
 *       }
 *     ]
 *   }
 *
 * Success response (SAP wraps result under `Data`, StatusCode 201):
 *   {
 *     "Message": "Stock transfer material to material created successfully",
 *     "StatusCode": 201,
 *     "Data": { "MaterialDocument": "4900003226", "MaterialDocumentYear": "2026", ... }
 *   }
 *
 * Exposes:
 *   - postStockTransferMaterialToMaterial(items, options)  single or bulk
 */

/* ── URL + env helpers ─────────────────────────────────────── */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const STOCK_TRANSFER_MTM_URL = () =>
    buildSapUrl(process.env.SAP_STOCK_TRANSFER_MTM_ENDPOINT || "stock-transfer-material-to-material");

const PLANT = () => process.env.SAP_TXN_PLANT || "1200";
const STORAGE_LOCATION = () => process.env.SAP_TXN_STORAGE_LOCATION || "1201";
const MOVEMENT_TYPE = () => process.env.SAP_STOCK_TRANSFER_MTM_MOVEMENT_TYPE || "309";
const GOODS_MOVEMENT_CODE = () => process.env.SAP_STOCK_TRANSFER_MTM_GOODS_MOVEMENT_CODE || "04";
const ENTRY_UNIT = () => process.env.SAP_STOCK_TRANSFER_MTM_ENTRY_UNIT || "KG";

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
 * @param {string} item.material          Material being transferred (issuing)
 * @param {string} item.issgOrRcvgMaterial Receiving material (material -> material)
 * @param {string} item.batch             Batch of the issuing material
 * @param {number|string} item.quantity   Quantity in entry unit
 * @param {string} [item.plant]           Defaults to SAP_TXN_PLANT
 * @param {string} [item.storageLocation] Defaults to SAP_TXN_STORAGE_LOCATION
 * @param {string} [item.goodsMovementType] Defaults to SAP_STOCK_TRANSFER_MTM_MOVEMENT_TYPE
 * @param {string} [item.entryUnit]       Defaults to SAP_STOCK_TRANSFER_MTM_ENTRY_UNIT
 * @param {string} [item.receivingBatch]  Optional batch for the receiving material
 * @param {string} [item.receivingPlant]  Optional receiving plant
 * @param {string} [item.receivingStorageLocation] Optional receiving storage location
 */
const buildTransferItem = (item) => {
    if (!item || typeof item !== "object") {
        throw new Error("stock transfer item must be an object");
    }

    const material = str(item.material ?? item.Material);
    const issgOrRcvgMaterial = str(item.issgOrRcvgMaterial ?? item.IssgOrRcvgMaterial);
    const batch = str(item.batch ?? item.Batch);
    const quantity = str(item.quantity ?? item.QuantityInEntryUnit);

    if (!material) throw new Error("stock transfer item requires `material`");
    if (!issgOrRcvgMaterial) throw new Error("stock transfer item requires `issgOrRcvgMaterial`");
    if (quantity === null || quantity === "") throw new Error("stock transfer item requires `quantity`");

    const entry = {
        Material: material,
        Plant: str(item.plant ?? item.Plant) || PLANT(),
        StorageLocation: str(item.storageLocation ?? item.StorageLocation) || STORAGE_LOCATION(),
        GoodsMovementType: str(item.goodsMovementType ?? item.GoodsMovementType) || MOVEMENT_TYPE(),
        Batch: batch,
        QuantityInEntryUnit: quantity,
        EntryUnit: str(item.entryUnit ?? item.EntryUnit) || ENTRY_UNIT(),
        IssgOrRcvgMaterial: issgOrRcvgMaterial,
    };

    // Optional receiving-side fields (only added when supplied).
    const receivingBatch = str(item.receivingBatch ?? item.IssuingOrReceivingBatch);
    if (receivingBatch) entry.IssuingOrReceivingBatch = receivingBatch;

    const receivingPlant = str(item.receivingPlant ?? item.IssuingOrReceivingPlant);
    if (receivingPlant) entry.IssuingOrReceivingPlant = receivingPlant;

    const receivingSloc = str(item.receivingStorageLocation ?? item.IssuingOrReceivingSpclStockInd);
    if (receivingSloc) entry.IssuingOrReceivingStorageLoc = receivingSloc;

    return entry;
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
        MaterialDocumentHeaderText: str(options.headerText) || "MES material to material transfer",
        to_MaterialDocumentItem: list.map(buildTransferItem),
    };
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Post a material-to-material stock transfer (movement type 309) to SAP.
 *
 * Accepts a single item or an array of items (bulk). Each item is transformed
 * into one `to_MaterialDocumentItem`.
 *
 * @param {object|object[]} items   single item or list of items (bulk)
 * @param {object} [options]        header overrides (see buildStockTransferPayload)
 * @returns {Promise<object>} { success, statusCode, message, materialDocument,
 *                              materialDocumentYear, payload, sap_response }
 */
export const postStockTransferMaterialToMaterial = async (items, options = {}) => {
    const payload = buildStockTransferPayload(items, options);
    const url = STOCK_TRANSFER_MTM_URL();
    // Optional correlation / source metadata for the log (passed by batch runners).
    const logContext = options.logContext || {};

    console.log("[SAP-POST][STOCK-TRANSFER-MTM] URL:", url);
    console.log("[SAP-POST][STOCK-TRANSFER-MTM] Payload:", JSON.stringify(payload));

    // Batch is logged per call; when a single item is posted, capture its batch.
    const firstBatch = payload.to_MaterialDocumentItem?.[0]?.Batch ?? null;
    const firstMaterial = payload.to_MaterialDocumentItem?.[0]?.Material ?? null;

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "STOCK_TRANSFER_MTM",
            status: "FAILED",
            sap_endpoint: process.env.SAP_STOCK_TRANSFER_MTM_ENDPOINT || "stock-transfer-material-to-material",
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
            operation: "STOCK_TRANSFER_MTM",
            status: "FAILED",
            sap_endpoint: process.env.SAP_STOCK_TRANSFER_MTM_ENDPOINT || "stock-transfer-material-to-material",
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
        throw new Error(`Stock transfer material-to-material not successful: ${detail}`);
    }

    await logSapCall({
        operation: "STOCK_TRANSFER_MTM",
        status: "SUCCESS",
        sap_endpoint: process.env.SAP_STOCK_TRANSFER_MTM_ENDPOINT || "stock-transfer-material-to-material",
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
   material_move -> SAP 309 transfer (batch runner)
   ══════════════════════════════════════════════════════════

   material_move rows are created when a bobbin's product_type is upgraded
   (e.g. final_grade = 'DCA1'). Each pending row (movement = false) is turned
   into one 309 transfer item:

       Material           <- existing_product_type   (issuing material)
       IssgOrRcvgMaterial <- new_product_type         (receiving material)
       Batch              <- bobbin_no

   On SAP success the corresponding rows are flagged movement = true so they
   are not posted again.

   Quantity comes from the material_move.qty column. When a row has no qty it
   falls back to the env default. EntryUnit uses the poster default.
       SAP_MATERIAL_MOVE_QTY             (fallback qty, default "1")
       SAP_STOCK_TRANSFER_MTM_ENTRY_UNIT (default "KG", shared with the poster)
*/

const MATERIAL_MOVE_QTY_FALLBACK = () => process.env.SAP_MATERIAL_MOVE_QTY || "1";

/**
 * Fetch material_move rows still pending a physical movement (movement = false).
 *
 * @param {number} [limit]  optional cap on how many rows to pull in one run
 * @returns {Promise<Array<{
 *   material_move_id: number,
 *   bobbin_no: string,
 *   existing_product_type: string|null,
 *   new_product_type: string|null,
 *   qty: number|string|null
 * }>>}
 */
export const fetchPendingMaterialMoves = async (limit = null) => {
    const params = [];
    let sql = `
        SELECT material_move_id, bobbin_no, existing_product_type, new_product_type, qty
          FROM material_move
         WHERE COALESCE(movement, false) = false
           AND existing_product_type IS NOT NULL
           AND new_product_type IS NOT NULL
         ORDER BY material_move_id ASC`;
    if (Number.isInteger(limit) && limit > 0) {
        params.push(limit);
        sql += `\n         LIMIT $${params.length}`;
    }
    const result = await pool.query(sql, params);
    return result.rows;
};

/**
 * Mark material_move rows as moved (movement = true) after a successful SAP
 * transfer.
 *
 * @param {number[]} ids  material_move_id values
 * @param {object} [client]  optional pg client (defaults to the shared pool)
 * @returns {Promise<number>} number of rows updated
 */
export const markMaterialMovesDone = async (ids, client = pool) => {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const result = await client.query(
        `UPDATE material_move
            SET movement = true, updated_at = current_timestamp
          WHERE material_move_id = ANY($1::int[])`,
        [ids]
    );
    return result.rowCount || 0;
};

/**
 * Turn a material_move row into a stock-transfer item for the 309 poster.
 *
 * @param {object} row  a material_move row
 * @returns {object} transfer item consumed by buildTransferItem
 */
const materialMoveToTransferItem = (row) => {
    // Prefer the row's own qty; fall back to the env default when null/empty.
    const qty =
        row.qty === null || row.qty === undefined || String(row.qty).trim() === ""
            ? MATERIAL_MOVE_QTY_FALLBACK()
            : row.qty;

    return {
        material: row.existing_product_type,
        issgOrRcvgMaterial: row.new_product_type,
        batch: row.bobbin_no,
        quantity: qty,
    };
};

/**
 * Post all pending material_move rows to SAP as material-to-material (309)
 * transfers, ONE ROW AT A TIME in FIFO order (oldest material_move_id first).
 *
 * Each pending row is its own SAP call and produces its own material document.
 * On success that row is flagged movement = true immediately. Rows are handled
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
export const postPendingMaterialMoves = async ({ limit = null } = {}) => {
    const rows = await fetchPendingMaterialMoves(limit);

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
        const item = materialMoveToTransferItem(row);
        try {
            const result = await postStockTransferMaterialToMaterial(item, {
                headerText: "MES material_move product-type upgrade",
                logContext: {
                    source_table: "material_move",
                    source_ids: [row.material_move_id],
                    reference_type: "MATERIAL_MOVE",
                },
            });

            await markMaterialMovesDone([row.material_move_id]);

            summary.posted += 1;
            summary.results.push({
                material_move_id: row.material_move_id,
                bobbin_no: row.bobbin_no,
                material_document: result.materialDocument,
            });
        } catch (error) {
            summary.failed += 1;
            summary.errors.push({
                material_move_id: row.material_move_id,
                bobbin_no: row.bobbin_no,
                message: error.message,
                http_status: error.response?.status,
                sap_response: error.response?.data,
            });
            console.error(
                `[SAP-POST][MATERIAL-MOVE] Failed for material_move ${row.material_move_id}:`,
                error.message
            );
        }
    }

    return summary;
};

export default postStockTransferMaterialToMaterial;
