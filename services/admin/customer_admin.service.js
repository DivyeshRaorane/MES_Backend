import pool from "../../db/postgres.js";

export const getAllCustomersS = async () => {
    const result = await pool.query(`SELECT * FROM customer_table ORDER BY customer_name`);
    return result.rows;
};

export const createCustomerS = async (data) => {
    const { customer_name, cust_address, customer_since } = data;
    const result = await pool.query(
        `INSERT INTO customer_table (customer_name, cust_address, customer_since) VALUES ($1, $2, $3) RETURNING *`,
        [customer_name, cust_address || null, customer_since || null]
    );
    return result.rows[0];
};

export const updateCustomerS = async (customer_id, data) => {
    const { customer_name, cust_address, customer_since, disable } = data;
    const result = await pool.query(
        `UPDATE customer_table SET customer_name = $1, cust_address = $2, customer_since = $3, disable = $4 WHERE customer_id = $5 RETURNING *`,
        [customer_name, cust_address || null, customer_since || null, disable ?? false, customer_id]
    );
    return result.rows[0];
};
