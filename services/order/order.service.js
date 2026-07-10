import pool from "../../db/postgres.js";

export const getAllOrdersS = async () => {
    const result = await pool.query(`SELECT * FROM packing_order ORDER BY created_at DESC`);
    return result.rows;
};

export const createOrderS = async (data) => {
    const { order_no, customer_name, required_km, box_capacity, stack_capacity } = data;

    const dupCheck = await pool.query(
        `SELECT packing_order_id FROM packing_order WHERE order_no = $1`,
        [order_no]
    );

    if (dupCheck.rows.length > 0) {
        throw new Error("Order number already exists.");
    }

    const result = await pool.query(
        `INSERT INTO packing_order (order_no, customer_name, required_km, box_capacity, stack_capacity)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [order_no, customer_name, required_km || null, box_capacity, stack_capacity]
    );

    return result.rows[0];
};

export const updateOrderS = async (packing_order_id, data) => {
    const { customer_name, required_km, box_capacity, stack_capacity } = data;

    const result = await pool.query(
        `UPDATE packing_order SET customer_name = $1, required_km = $2, box_capacity = $3, stack_capacity = $4
         WHERE packing_order_id = $5 RETURNING *`,
        [customer_name, required_km || null, box_capacity, stack_capacity, packing_order_id]
    );

    if (result.rowCount === 0) {
        throw new Error("Order not found.");
    }

    return result.rows[0];
};
