import pool from "../../db/postgres.js";

export const getQualityEntryReportS = async (filters) => {
    const { date_from, date_to, bobbin_no } = filters;
    let query = `SELECT * FROM qc_entry_temp WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND TO_DATE(otdr_test_date, 'MM/DD/YYYY') >= $${params.length}::date`; }
    if (date_to) { params.push(date_to); query += ` AND TO_DATE(otdr_test_date, 'MM/DD/YYYY') <= $${params.length}::date`; }
    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }

    query += ` ORDER BY bobbin_no DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};
