import pool from "../../db/postgres.js";

export const getTraysS = async () => {
    const result = await pool.query(
        `SELECT tm.*,
            (SELECT COUNT(*) FROM tray_position tp WHERE tp.tray_id = tm.tray_id AND tp.status = 'OCCUPIED') as occupied_count
         FROM tray_master tm
         WHERE tm.is_active = TRUE
         ORDER BY tm.tray_no`
    );
    return result.rows;
};

export const getPositionsS = async (tray_id) => {
    const result = await pool.query(
        `SELECT * FROM tray_position WHERE tray_id = $1 ORDER BY position_no`,
        [tray_id]
    );
    return result.rows;
};

export const assignBobbinS = async (tray_id, position_no, bobbin_no, updated_by) => {
    // Step 1: Check bobbin exists in bobbin_entries
    const entryCheck = await pool.query(
        `SELECT bobbin_no, is_qc_out FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (entryCheck.rows.length === 0) {
        throw new Error("Bobbin not found.");
    }

    // Step 2: Check is_qc_out = TRUE
    if (entryCheck.rows[0].is_qc_out !== true) {
        throw new Error("Bobbin is not QC Out. Cannot place in tray.");
    }

    // Step 3: Check position is EMPTY
    const posCheck = await pool.query(
        `SELECT status FROM tray_position WHERE tray_id = $1 AND position_no = $2`,
        [tray_id, position_no]
    );

    if (posCheck.rows.length === 0) {
        throw new Error("Position not found.");
    }

    if (posCheck.rows[0].status === 'OCCUPIED') {
        throw new Error("Position is already occupied.");
    }

    // Step 4: Check bobbin not already in any tray
    const bobbinCheck = await pool.query(
        `SELECT tp.position_no, tm.tray_no
         FROM tray_position tp
         JOIN tray_master tm ON tp.tray_id = tm.tray_id
         WHERE tp.bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinCheck.rows.length > 0) {
        const { tray_no, position_no: pos } = bobbinCheck.rows[0];
        throw new Error(`Bobbin is already placed in Tray ${tray_no}, Position ${pos}.`);
    }

    // Step 5: Assign
    await pool.query(
        `UPDATE tray_position SET bobbin_no = $1, status = 'OCCUPIED', updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE tray_id = $3 AND position_no = $4 AND status = 'EMPTY'`,
        [bobbin_no, updated_by, tray_id, position_no]
    );

    return { success: true, message: "Bobbin placed successfully." };
};

export const removeBobbinS = async (tray_id, position_no, updated_by) => {
    const result = await pool.query(
        `UPDATE tray_position SET bobbin_no = NULL, status = 'EMPTY', updated_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE tray_id = $2 AND position_no = $3 AND status = 'OCCUPIED'`,
        [updated_by, tray_id, position_no]
    );

    if (result.rowCount === 0) {
        throw new Error("Position is already empty.");
    }

    return { success: true, message: "Bobbin removed." };
};

export const searchBobbinS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT tp.*, tm.tray_no, tm.tray_name
         FROM tray_position tp
         JOIN tray_master tm ON tp.tray_id = tm.tray_id
         WHERE tp.bobbin_no = $1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        tray_id: row.tray_id,
        tray_no: row.tray_no,
        tray_name: row.tray_name,
        position_no: row.position_no
    };
};
