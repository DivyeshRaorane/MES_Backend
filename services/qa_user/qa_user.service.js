import pool from "../../db/postgres.js";

// is_active: true | false | null (null = all rows)
export const getAllQaUsersS = async (is_active = null) => {
    const query = `
    SELECT qa_user_id, emp_id, qa_user_name, is_active, created_at
    FROM qa_users
    WHERE ($1::boolean IS NULL OR is_active = $1::boolean)
    ORDER BY qa_user_id ASC;
    `;

    const result = await pool.query(query, [is_active]);
    return result.rows;
};
