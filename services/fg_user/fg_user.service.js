import pool from "../../db/postgres.js";

// is_active: true | false | null (null = all rows)
export const getAllFgUsersS = async (is_active = null) => {
    const query = `
    SELECT fg_user_id, emp_id, fg_user_name, is_active, created_at
    FROM fg_users
    WHERE ($1::boolean IS NULL OR is_active = $1::boolean)
    ORDER BY fg_user_name ASC, fg_user_id ASC;
    `;

    const result = await pool.query(query, [is_active]);
    return result.rows;
};
