import pool from "../../db/postgres.js";

export const getAllCustomersS = async () => {
    const result = await pool.query(`SELECT * FROM customer_table ORDER BY customer_name`);
    return result.rows;
};

export const createCustomerS = async (data) => {
    const { customer_name, customer_since } = data;
    const result = await pool.query(
        `INSERT INTO customer_table (customer_name, customer_since) VALUES ($1, $2) RETURNING *`,
        [customer_name, customer_since || null]
    );
    return result.rows[0];
};

export const updateCustomerS = async (customer_id, data) => {
    const { customer_name, customer_since, disable } = data;
    const result = await pool.query(
        `UPDATE customer_table SET customer_name = $1, customer_since = $2, disable = $3 WHERE customer_id = $4 RETURNING *`,
        [customer_name, customer_since || null, disable, customer_id]
    );
    return result.rows[0];
};
