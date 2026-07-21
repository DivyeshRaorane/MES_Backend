import pool from "../../db/postgres.js";

export const getSplicingListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM splicing_entry WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND (bobbin_a_no ILIKE $${params.length} OR bobbin_b_no ILIKE $${params.length})`; }
    if (date_from) { params.push(date_from); query += ` AND created_at::date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND created_at::date <= $${params.length}`; }

    query += ` ORDER BY splicing_id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getSplicingByIdS = async (id) => {
    const result = await pool.query(`SELECT * FROM splicing_entry WHERE splicing_id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};

export const createSplicingS = async (payload) => {
    const { bobbin_a_no, bobbin_b_no, machine_loss, product_type, brand_name, remark,
            a_1310, a_1550, a_1625, b_1310, b_1550, b_1625,
            ave_loss_1310, ave_loss_1550, ave_loss_1625, logged_in_user } = payload;

    const result = await pool.query(
        `INSERT INTO splicing_entry (
            bobbin_a_no, bobbin_b_no, machine_loss, product_type, brand_name, remark,
            a_1310, a_1550, a_1625, b_1310, b_1550, b_1625,
            ave_loss_1310, ave_loss_1550, ave_loss_1625, logged_in_user
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING splicing_id`,
        [
            bobbin_a_no, bobbin_b_no, machine_loss,
            product_type, brand_name, remark || null,
            a_1310 || null, a_1550 || null, a_1625 || null,
            b_1310 || null, b_1550 || null, b_1625 || null,
            ave_loss_1310 || null, ave_loss_1550 || null, ave_loss_1625 || null,
            logged_in_user
        ]
    );

    return { success: true, message: "Splicing entry created", splicing_id: result.rows[0].splicing_id };
};

export const updateSplicingS = async (id, payload) => {
    const { bobbin_a_no, bobbin_b_no, machine_loss, product_type, brand_name, remark,
            a_1310, a_1550, a_1625, b_1310, b_1550, b_1625,
            ave_loss_1310, ave_loss_1550, ave_loss_1625, logged_in_user } = payload;

    await pool.query(
        `UPDATE splicing_entry SET
            bobbin_a_no=$1, bobbin_b_no=$2, machine_loss=$3, product_type=$4, brand_name=$5, remark=$6,
            a_1310=$7, a_1550=$8, a_1625=$9, b_1310=$10, b_1550=$11, b_1625=$12,
            ave_loss_1310=$13, ave_loss_1550=$14, ave_loss_1625=$15, logged_in_user=$16
         WHERE splicing_id = $17`,
        [
            bobbin_a_no, bobbin_b_no, machine_loss,
            product_type, brand_name, remark || null,
            a_1310 || null, a_1550 || null, a_1625 || null,
            b_1310 || null, b_1550 || null, b_1625 || null,
            ave_loss_1310 || null, ave_loss_1550 || null, ave_loss_1625 || null,
            logged_in_user, id
        ]
    );

    return { success: true, message: "Splicing entry updated" };
};
