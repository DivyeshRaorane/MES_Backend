import pool from "../../db/postgres.js";

export const getAllComplaintsS = async (status) => {
    let query, values;

    if (status) {
        query = `SELECT * FROM customer_complaint WHERE complaint_status = $1 ORDER BY created_at DESC`;
        values = [status];
    } else {
        query = `SELECT * FROM customer_complaint ORDER BY created_at DESC`;
        values = [];
    }

    const result = await pool.query(query, values);
    return result.rows;
};

export const getComplaintByIdS = async (complaint_id) => {
    const result = await pool.query(
        `SELECT * FROM customer_complaint WHERE complaint_id = $1`,
        [complaint_id]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};

export const createComplaintS = async (payload) => {
    const { complaint_type, customer_name, raised_by, complaint_date,
            product_details, po_no, po_quantity, reject_quantity,
            shipment_date, grn_no, test_cert_no, logged_in_user } = payload;

    // Generate complaint_id: WCO-YYYYMMDDHHmmss
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const complaint_id = `WCO-${ts}`;

    const result = await pool.query(
        `INSERT INTO customer_complaint (
            complaint_id, complaint_type, customer_name, raised_by, complaint_date,
            product_details, po_no, po_quantity, reject_quantity,
            shipment_date, grn_no, test_cert_no, complaint_status, logged_in_user
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'open',$13)
        RETURNING *`,
        [complaint_id, complaint_type, customer_name, raised_by, complaint_date,
         product_details, po_no, po_quantity || null, reject_quantity || null,
         shipment_date || null, grn_no || null, test_cert_no || null, logged_in_user]
    );

    return result.rows[0];
};

export const updateComplaintS = async (complaint_id, payload) => {
    const { complaint_status, closed_date, complaint_feedBack } = payload;

    const check = await pool.query(
        `SELECT complaint_id FROM customer_complaint WHERE complaint_id = $1`,
        [complaint_id]
    );

    if (check.rows.length === 0) {
        throw new Error("Complaint not found.");
    }

    const result = await pool.query(
        `UPDATE customer_complaint
         SET complaint_status = $1, closed_date = $2, complaint_feedBack = COALESCE($3, complaint_feedBack)
         WHERE complaint_id = $4
         RETURNING *`,
        [complaint_status, closed_date || null, complaint_feedBack || null, complaint_id]
    );

    return result.rows[0];
};
