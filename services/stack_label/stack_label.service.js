import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════════════════
// Stack Label data service (consignee address sticker)
//
// Input : array of bobbin_no values.
// Output: { status, message, data }
//
//   data = [ { bobbin_no, packing_order, customer_name, cust_address }, ... ]
//
// Lookup chain (per bobbin):
//   packing_order_bobbin.bobbin_no      -> packing_order
//   packing_order.order_no              -> customer_name
//   customer_table.customer_name        -> cust_address
// ═══════════════════════════════════════════════════════════════════════════

const toText = (v) => (v === null || v === undefined ? "" : String(v));

/**
 * @param {string[]} bobbinNos
 * @returns {Promise<{status:number, message:string, data:Array<Object>}>}
 */
export const getStackLabelsS = async (bobbinNos) => {
    const list = [...new Set(
        (Array.isArray(bobbinNos) ? bobbinNos : [bobbinNos])
            .filter((b) => typeof b === "string")
            .map((b) => b.trim())
            .filter((b) => b.length > 0)
    )];

    if (list.length === 0) {
        return { status: 400, message: "bobbin_nos must contain at least one bobbin number", data: [] };
    }

    // One batched query. DISTINCT ON keeps a single row per bobbin (latest packing row);
    // the LATERAL join picks one customer row (active first) so duplicate customer names
    // can never multiply the result.
    const result = await pool.query(
        `
        SELECT DISTINCT ON (pob.bobbin_no)
            pob.bobbin_no,
            pob.packing_order,
            po.customer_name,
            ct.cust_address
        FROM packing_order_bobbin pob
        LEFT JOIN packing_order po ON po.order_no = pob.packing_order
        LEFT JOIN LATERAL (
            SELECT c.cust_address
            FROM customer_table c
            WHERE LOWER(TRIM(c.customer_name)) = LOWER(TRIM(po.customer_name))
            ORDER BY COALESCE(c.disable, false), c.customer_id DESC
            LIMIT 1
        ) ct ON TRUE
        WHERE pob.bobbin_no = ANY($1::text[])
        ORDER BY pob.bobbin_no, pob.packing_order_bobbin_id DESC
        `,
        [list]
    );

    const byBobbin = new Map(result.rows.map((r) => [r.bobbin_no, r]));

    // Keep the order the user entered; skip bobbins with no packing row.
    const data = list
        .filter((no) => byBobbin.has(no))
        .map((no) => {
            const r = byBobbin.get(no);
            return {
                bobbin_no: no,
                packing_order: toText(r.packing_order),
                customer_name: toText(r.customer_name),
                cust_address: toText(r.cust_address).trim(),
            };
        });

    if (data.length === 0) {
        return { status: 404, message: "Bobbin not found", data: [] };
    }

    const missing = list.filter((no) => !byBobbin.has(no));
    const message = missing.length > 0
        ? `Stack label data fetched. Not found: ${missing.join(", ")}`
        : "Stack label data fetched successfully";

    return { status: 200, message, data };
};
