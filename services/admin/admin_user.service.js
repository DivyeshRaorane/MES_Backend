import pool from "../../db/postgres.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// GET all users with departments
export const getAllUsersS = async () => {
    const query = `
        SELECT u.emp_id, u.emp_name, u.emp_mail_id, u.mobile_no, u.role, u.is_active, u.created_at, u.updated_at,
            COALESCE(json_agg(json_build_object('id', d.id, 'name', d.d_name)) FILTER (WHERE d.id IS NOT NULL), '[]') as departments
        FROM users u
        LEFT JOIN user_departments ud ON u.emp_id = ud.emp_id
        LEFT JOIN departments d ON ud.department_id = d.id
        GROUP BY u.emp_id
        ORDER BY u.created_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// GET all departments
export const getDepartmentsS = async () => {
    const result = await pool.query(`SELECT * FROM departments ORDER BY id`);
    return result.rows;
};

// CREATE department
export const createDepartmentS = async (data) => {
    const { d_name } = data;
    const result = await pool.query(
        `INSERT INTO departments (d_name) VALUES ($1) RETURNING *`,
        [d_name]
    );
    return result.rows[0];
};

// UPDATE department
export const updateDepartmentS = async (id, data) => {
    const { d_name, disable } = data;
    const result = await pool.query(
        `UPDATE departments SET d_name = $1, disable = $2 WHERE id = $3 RETURNING *`,
        [d_name, disable, id]
    );
    return result.rows[0];
};

// CREATE user
export const createUserS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { emp_id, emp_name, emp_mail_id, mobile_no, password, role, is_active, departments } = payload;

        // Check uniqueness
        const existCheck = await client.query(
            `SELECT emp_id FROM users WHERE emp_id = $1`,
            [emp_id]
        );

        if (existCheck.rows.length > 0) {
            throw new Error("Employee ID already exists.");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        await client.query(
            `INSERT INTO users (emp_id, emp_name, emp_mail_id, mobile_no, password, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [emp_id, emp_name, emp_mail_id, mobile_no, hashedPassword, role, is_active !== false]
        );

        // Insert department mappings
        for (const dept_id of departments) {
            await client.query(
                `INSERT INTO user_departments (emp_id, department_id) VALUES ($1, $2)`,
                [emp_id, dept_id]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "User created successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// UPDATE user
export const updateUserS = async (emp_id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { emp_name, emp_mail_id, mobile_no, password, role, is_active, departments } = payload;

        // Update user fields
        await client.query(
            `UPDATE users SET emp_name = $1, emp_mail_id = $2, mobile_no = $3, role = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
             WHERE emp_id = $6`,
            [emp_name, emp_mail_id, mobile_no, role, is_active, emp_id]
        );

        // Update password only if provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            await client.query(
                `UPDATE users SET password = $1 WHERE emp_id = $2`,
                [hashedPassword, emp_id]
            );
        }

        // Replace department mappings
        await client.query(`DELETE FROM user_departments WHERE emp_id = $1`, [emp_id]);

        for (const dept_id of departments) {
            await client.query(
                `INSERT INTO user_departments (emp_id, department_id) VALUES ($1, $2)`,
                [emp_id, dept_id]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "User updated successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// PATCH user status
export const changeUserStatusS = async (emp_id, is_active) => {
    await pool.query(
        `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE emp_id = $2`,
        [is_active, emp_id]
    );
    return { success: true, message: "User status updated." };
};
