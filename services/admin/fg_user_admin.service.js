import pool from "../../db/postgres.js";

const FG_USER_NAME_MAX = 100;
const EMP_ID_MAX = 20;
const RETURN_COLUMNS = "fg_user_id, emp_id, fg_user_name, is_active, created_at";

// Error carrying an HTTP status for the controller.
const httpError = (status, message) => Object.assign(new Error(message), { status });

const normalizeFgUserName = (value) => {
    const name = typeof value === "string" ? value.trim() : "";
    if (!name) throw httpError(400, "FG user name is required");
    if (name.length > FG_USER_NAME_MAX) throw httpError(400, `FG user name must be at most ${FG_USER_NAME_MAX} characters`);
    return name;
};

// Empty / missing -> NULL
const normalizeEmpId = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string" && typeof value !== "number") throw httpError(400, "Employee ID must be a string");
    const empId = String(value).trim();
    if (!empId) return null;
    if (empId.length > EMP_ID_MAX) throw httpError(400, `Employee ID must be at most ${EMP_ID_MAX} characters`);
    return empId;
};

const normalizeIsActive = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    throw httpError(400, "is_active must be true or false");
};

const parseId = (value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw httpError(400, "Invalid FG user id");
    return id;
};

// excludeId: ignore this row (used on update)
const assertEmpIdUnique = async (empId, excludeId = null) => {
    if (empId === null) return;
    const dup = await pool.query(
        `SELECT 1 FROM fg_users
         WHERE LOWER(TRIM(emp_id)) = LOWER($1)
           AND ($2::int IS NULL OR fg_user_id <> $2::int)
         LIMIT 1`,
        [empId, excludeId]
    );
    if (dup.rows.length > 0) throw httpError(409, "Employee ID already exists");
};

export const createFgUserAdminS = async (data = {}) => {
    const fg_user_name = normalizeFgUserName(data.fg_user_name);
    const emp_id = normalizeEmpId(data.emp_id);

    await assertEmpIdUnique(emp_id);

    // is_active and created_at use the DB defaults.
    const result = await pool.query(
        `INSERT INTO fg_users (emp_id, fg_user_name)
         VALUES ($1, $2)
         RETURNING ${RETURN_COLUMNS}`,
        [emp_id, fg_user_name]
    );
    return result.rows[0];
};

// Partial update: only emp_id, fg_user_name, is_active. fg_user_id / created_at / unknown keys are ignored.
export const updateFgUserAdminS = async (idParam, data = {}) => {
    const fg_user_id = parseId(idParam);

    const updates = {};
    if ("fg_user_name" in data) updates.fg_user_name = normalizeFgUserName(data.fg_user_name);
    if ("emp_id" in data) updates.emp_id = normalizeEmpId(data.emp_id);
    if ("is_active" in data) updates.is_active = normalizeIsActive(data.is_active);

    const existing = await pool.query(`SELECT 1 FROM fg_users WHERE fg_user_id = $1`, [fg_user_id]);
    if (existing.rows.length === 0) throw httpError(404, "FG user not found");

    const columns = Object.keys(updates);
    if (columns.length === 0) throw httpError(400, "No fields to update");

    if ("emp_id" in updates) await assertEmpIdUnique(updates.emp_id, fg_user_id);

    // Column names come from the fixed list above, never from the request.
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
    const values = [...columns.map((col) => updates[col]), fg_user_id];

    const result = await pool.query(
        `UPDATE fg_users SET ${setClause}
         WHERE fg_user_id = $${values.length}
         RETURNING ${RETURN_COLUMNS}`,
        values
    );
    return result.rows[0];
};
