import pool from "../../db/postgres.js";

export const getAllGradesS = async () => {
    const result = await pool.query(`SELECT * FROM qc_grade ORDER BY priority`);
    return result.rows;
};

export const createGradeS = async (data) => {
    // Check priority uniqueness per matcode
    const priCheck = await pool.query(
        `SELECT qc_entry_id FROM qc_grade WHERE matcode = $1 AND priority = $2 LIMIT 1`,
        [data.matcode, data.priority]
    );

    if (priCheck.rows.length > 0) {
        throw new Error(`Priority ${data.priority} already exists for matcode ${data.matcode}.`);
    }

    // Check grade uniqueness per matcode
    const gradeCheck = await pool.query(
        `SELECT qc_entry_id FROM qc_grade WHERE matcode = $1 AND grade = $2 LIMIT 1`,
        [data.matcode, data.grade]
    );

    if (gradeCheck.rows.length > 0) {
        throw new Error(`Grade "${data.grade}" already exists for matcode ${data.matcode}.`);
    }

    const keys = Object.keys(data);
    const values = Object.values(data).map(v => (v === '' || v === undefined) ? null : v);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

    const result = await pool.query(
        `INSERT INTO qc_grade (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`,
        values
    );
    return result.rows[0];
};

export const updateGradeS = async (qc_entry_id, data) => {
    // If priority or matcode is being updated, check for duplicates
    if (data.priority !== undefined || data.matcode !== undefined || data.grade !== undefined) {
        // Get current record to fill in missing fields
        const current = await pool.query(
            `SELECT matcode, priority, grade FROM qc_grade WHERE qc_entry_id = $1`,
            [qc_entry_id]
        );

        if (current.rows.length === 0) {
            throw new Error("Grade record not found.");
        }

        const matcode = data.matcode || current.rows[0].matcode;
        const priority = data.priority !== undefined ? data.priority : current.rows[0].priority;
        const grade = data.grade || current.rows[0].grade;

        const priCheck = await pool.query(
            `SELECT qc_entry_id FROM qc_grade WHERE matcode = $1 AND priority = $2 AND qc_entry_id != $3 LIMIT 1`,
            [matcode, priority, qc_entry_id]
        );

        if (priCheck.rows.length > 0) {
            throw new Error(`Priority ${priority} already exists for matcode ${matcode}.`);
        }

        const gradeCheck = await pool.query(
            `SELECT qc_entry_id FROM qc_grade WHERE matcode = $1 AND grade = $2 AND qc_entry_id != $3 LIMIT 1`,
            [matcode, grade, qc_entry_id]
        );

        if (gradeCheck.rows.length > 0) {
            throw new Error(`Grade "${grade}" already exists for matcode ${matcode}.`);
        }
    }

    const keys = Object.keys(data);
    const values = keys.map(k => (data[k] === '' || data[k] === undefined) ? null : data[k]);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(qc_entry_id);

    const result = await pool.query(
        `UPDATE qc_grade SET ${setClause} WHERE qc_entry_id = $${values.length} RETURNING *`,
        values
    );
    return result.rows[0];
};
