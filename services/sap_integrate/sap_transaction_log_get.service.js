import pool from "../../db/postgres.js";

/**
 * SAP Transaction Log — read service
 * ══════════════════════════════════
 *
 * Fetches rows from `sap_transaction_log` with optional filters. Every filter
 * is optional: when a value is not provided it is simply NOT applied, so the
 * query returns all rows for that dimension.
 *
 * Supported filters:
 *   - prod_order : exact match on prod_order
 *   - batch      : exact match on batch
 *   - status     : exact match on status      (e.g. "SUCCESS" | "FAILED")
 *   - operation  : exact match on operation   (e.g. "FG_CONFIRMATION")
 *   - from_date  : created_at >= from_date     (lower bound of the time range)
 *   - to_date    : created_at <= to_date       (upper bound of the time range)
 *
 * from_date / to_date are independent: you can pass only one, both, or neither.
 *
 * @param {object} [filters]
 * @param {string} [filters.prod_order]
 * @param {string} [filters.batch]
 * @param {string} [filters.status]
 * @param {string} [filters.operation]
 * @param {string} [filters.from_date]   ISO date / timestamp string
 * @param {string} [filters.to_date]     ISO date / timestamp string
 * @returns {Promise<Array>} matching log rows, newest first
 */
export const getSapTransactionLogsS = async (filters = {}) => {
    const { prod_order, batch, status, operation, from_date, to_date } = filters;

    const conditions = [];
    const params = [];

    const addFilter = (value, column) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            params.push(value);
            conditions.push(`${column} = $${params.length}`);
        }
    };

    addFilter(prod_order, "prod_order");
    addFilter(batch, "batch");
    addFilter(status, "status");
    addFilter(operation, "operation");

    if (from_date !== undefined && from_date !== null && String(from_date).trim() !== "") {
        params.push(from_date);
        conditions.push(`created_at >= $${params.length}`);
    }

    if (to_date !== undefined && to_date !== null && String(to_date).trim() !== "") {
        params.push(to_date);
        conditions.push(`created_at <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
        SELECT *
        FROM sap_transaction_log
        ${whereClause}
        ORDER BY created_at DESC, log_id DESC;
    `;

    const result = await pool.query(query, params);
    return result.rows;
};
