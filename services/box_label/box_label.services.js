import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════════════════
// Box Label data service
//
// Input : one box_no or an array of box_no values.
// Output: { status, message, data }
//
//   data = [
//     {
//       customer_name,   -> packing_order.customer_name (order_no = packing_order)
//       product,         -> bobbin_entries.product_type + " " + preform_accept.material_description
//                           (via any one bobbin of the box)
//       box_no,
//       packing_order, stack_no,
//       bobbin_details: [ { fid, color, length } ]   // fid = bobbin_no, length in metres
//     },
//     ...one entry per box...
//   ]
//
// Flow:
//   1. Get all packing_order_bobbin rows for the requested box_no(s)
//      (+ customer_name from packing_order, fiber_color/preform_id from bobbin_entries).
//   2. Per box, take any one bobbin's preform_id and read material_description
//      from preform_accept -> product.
//   3. Build bobbin_details for every bobbin of the box (fid, color, length in m).
//
// NOTE: box_no is only unique within a packing order (and stack), so rows are
// grouped by (packing_order, stack_no, box_no).
// ═══════════════════════════════════════════════════════════════════════════

// km -> metres, rounded to 2 decimals to avoid float noise (e.g. 25.123 * 1000).
const kmToMetres = (km) => {
    const n = Number(km);
    if (km === null || km === undefined || isNaN(n)) return 0;
    return Number((n * 1000).toFixed(2));
};

const toText = (v) => (v === null || v === undefined ? "" : String(v));

/**
 * @param {string|number|Array<string|number>} boxNos
 * @returns {Promise<{status:number, message:string, data:Array<Object>}>}
 */
export const getBoxLabelsS = async (boxNos) => {
    // Accept a single value or an array; drop blanks and duplicates.
    const list = [...new Set(
        (Array.isArray(boxNos) ? boxNos : [boxNos])
            .filter((b) => b !== null && b !== undefined && String(b).trim() !== "")
            .map((b) => (typeof b === "string" ? b.trim() : b))
    )];

    if (list.length === 0) {
        return { status: 400, message: "box_no is required", data: [] };
    }

    // ── Step 1: all bobbin rows for the requested box numbers ──
    const rowsResult = await pool.query(
        `
        SELECT
            pob.packing_order,
            pob.stack_no,
            pob.box_no,
            pob.bobbin_no,
            pob.length_km,
            po.customer_name,
            be.fiber_color,
            be.preform_id,
            be.product_type
        FROM packing_order_bobbin pob
        LEFT JOIN packing_order po  ON po.order_no  = pob.packing_order
        LEFT JOIN bobbin_entries be ON be.bobbin_no = pob.bobbin_no
        WHERE pob.box_no = ANY($1)
        ORDER BY pob.packing_order, pob.stack_no, pob.box_no, pob.packing_order_bobbin_id
        `,
        [list]
    );

    if (rowsResult.rows.length === 0) {
        return { status: 404, message: "No data found for the given box number(s)", data: [] };
    }

    // ── Group rows per box (insertion order preserved) ──
    const boxes = new Map();
    for (const row of rowsResult.rows) {
        const key = `${row.packing_order}|${row.stack_no}|${row.box_no}`;

        let box = boxes.get(key);
        if (!box) {
            box = {
                customer_name: toText(row.customer_name),
                product: "",
                box_no: row.box_no,
                packing_order: toText(row.packing_order),
                stack_no: row.stack_no,
                bobbin_details: [],
                _preform_id: null, // internal: preform of any one bobbin in this box
                _product_type: "", // internal: bobbin_entries.product_type of any one bobbin
            };
            boxes.set(key, box);
        }

        // Any one bobbin is enough to find the product; take the first with a preform_id.
        if (!box._preform_id && row.preform_id) {
            box._preform_id = row.preform_id;
        }
        if (!box._product_type && row.product_type) {
            box._product_type = toText(row.product_type).trim();
        }

        box.bobbin_details.push({
            fid: toText(row.bobbin_no),
            color: toText(row.fiber_color),
            length: kmToMetres(row.length_km),
        });
    }

    // ── Step 2: product (material_description) for the picked preform of each box ──
    const preformIds = [...new Set([...boxes.values()].map((b) => b._preform_id).filter(Boolean))];
    const productByPreform = new Map();

    if (preformIds.length > 0) {
        const productResult = await pool.query(
            `SELECT preform_id, material_description
             FROM preform_accept
             WHERE preform_id = ANY($1)`,
            [preformIds]
        );
        for (const p of productResult.rows) {
            productByPreform.set(p.preform_id, p.material_description);
        }
    }

    // product = "<product_type> <material_description>" (space separated, blanks skipped)
    const data = [...boxes.values()].map(({ _preform_id, _product_type, ...box }) => ({
        ...box,
        product: [_product_type, "Single Mode Optical Fiber"]
            .filter(Boolean)
            .join(" "),
    }));

    // Tell the caller if some requested boxes had no packing data.
    const foundBoxNos = new Set(data.map((b) => String(b.box_no)));
    const missing = list.filter((b) => !foundBoxNos.has(String(b)));
    const message = missing.length > 0
        ? `Box label data fetched. Not found: ${missing.join(", ")}`
        : "Box label data fetched successfully";

    return { status: 200, message, data };
};
