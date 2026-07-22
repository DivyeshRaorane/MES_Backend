import pool from "../../db/postgres.js";

export const getPtAllocationReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `SELECT * FROM pt_allocation WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND allocation_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND allocation_date <= $${params.length}`; }
    if (spool_id) { params.push(`%${spool_id}%`); query += ` AND spool_id ILIKE $${params.length}`; }

    query += ` ORDER BY pt_allocation_id DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};



export const getPtEntryReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `SELECT * FROM pt_entry WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND created_at::date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND created_at::date <= $${params.length}`; }
    if (spool_id) { params.push(`%${spool_id}%`); query += ` AND spool_id ILIKE $${params.length}`; }

    query += ` ORDER BY pt_entry_id DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getPtFlawsReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `SELECT * FROM pt_flaw_details WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND entry_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND entry_date <= $${params.length}`; }
    if (spool_id) { params.push(`%${spool_id}%`); query += ` AND spool_id ILIKE $${params.length}`; }

    query += ` ORDER BY pt_flaw_id DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getFiberEntryReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `SELECT * FROM bobbin_entries WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND created_at::date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND created_at::date <= $${params.length}`; }
    if (spool_id) { params.push(`%${spool_id}%`); query += ` AND (spool_id ILIKE $${params.length} OR bobbin_no ILIKE $${params.length})`; }

    query += ` ORDER BY fid_create_id DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getColoringReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `SELECT * FROM coloring_entry WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND entry_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND entry_date <= $${params.length}`; }
    if (spool_id) { params.push(`%${spool_id}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }

    query += ` ORDER BY colouring_id DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};






export const getRewindingReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `SELECT * FROM rewinding_entry WHERE 1=1`;
    const params = [];

    
    if (date_from) { params.push(date_from); query += ` AND created_at::date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND created_at::date <= $${params.length}`; }
    if (spool_id) { params.push(`%${spool_id}%`); query += ` AND (bobbin_no ILIKE $${params.length} OR parent_bobbin_no ILIKE $${params.length})`; }

    query += ` ORDER BY rewinding_id DESC LIMIT 1000`;
    console.log(typeof query);
console.log("Filter",query, params)

    const result = await pool.query(query, params);
    
    return result.rows;
};
