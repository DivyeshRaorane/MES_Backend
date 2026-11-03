import pool from "../../../db/postgres.js";
import { syncProcessOrders } from "./process_order.service.js";

/**
 * Re-sync one process order from SAP into order_hdr / order_comp / order_opr
 * after a TECO or quantity change.
 *
 * The SAP sync endpoint filters by creation date only, so this syncs the
 * order's creation day (via the standard syncProcessOrders). The date comes
 * from SAP when available (TECO response), else from order_hdr.
 *
 * Never throws: the SAP action already succeeded, so a sync problem is only
 * reported back.
 */

const pad = (n) => String(n).padStart(2, "0");

/** Today's local date as "YYYY-MM-DD" (used for orders created just now). */
export const todayYmd = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * "/Date(1793664000000)/" -> "YYYY-MM-DD" (SAP sends UTC midnight).
 * A plain "YYYY-MM-DD" is returned as-is.
 */
const sapDateToYmd = (v) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v || ""))) return String(v);
    const m = /\/Date\((\d+)\)\//.exec(String(v || ""));
    if (!m) return null;
    const d = new Date(Number(m[1]));
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** order_hdr.order_creation_date (DATE) as "YYYY-MM-DD", formatted in SQL to avoid timezone shifts. */
const getCreationDateFromHdr = async (orderNo) => {
    const r = await pool.query(
        `SELECT to_char(order_creation_date, 'YYYY-MM-DD') AS d
           FROM order_hdr
          WHERE order_no = $1 OR order_no = $2
          LIMIT 1`,
        [orderNo, orderNo.padStart(12, "0")]
    );
    return r.rows[0]?.d || null;
};

/**
 * @param {string} orderNo                order number without leading zeros
 * @param {string} [sapCreationDate]      SAP "/Date(ms)/" or "YYYY-MM-DD" if known
 * @returns {{ ran, date, synced, status, message }}
 */
export const resyncOrderFromSAP = async (orderNo, sapCreationDate) => {
    let date = null;
    try {
        date = sapDateToYmd(sapCreationDate) || (await getCreationDateFromHdr(orderNo));
    } catch (e) {
        return { ran: false, date: null, synced: false, status: null, message: `Sync skipped: ${e.message}` };
    }

    if (!date) {
        return {
            ran: false,
            date: null,
            synced: false,
            status: null,
            message: "Sync skipped: order creation date not known. Run 'Sync from SAP' manually.",
        };
    }

    try {
        const summary = await syncProcessOrders(date);
        const detail = (summary.details || []).find(
            (d) => d.order_no && String(d.order_no).replace(/^0+/, "") === orderNo
        );
        const synced = detail?.status === "updated" || detail?.status === "inserted";
        return {
            ran: true,
            date,
            synced,
            status: detail?.status || null,
            message: synced
                ? `MES order list synced from SAP (${date})`
                : detail
                  ? `Sync ${detail.status}: ${detail.message}`
                  : `Sync ran for ${date} but order ${orderNo} was not returned by SAP`,
        };
    } catch (e) {
        console.error("[Process Order Resync] sync failed for", orderNo, date, e.message);
        return { ran: true, date, synced: false, status: "failed", message: `Sync failed: ${e.message}` };
    }
};
