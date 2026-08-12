import pool from "../../db/postgres.js";

export const getAllTraysS = async () => {
    const result = await pool.query(`SELECT * FROM tray_master ORDER BY tray_no`);
    return result.rows;
};

export const createTrayS = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { tray_no, tray_name, total_positions } = data;

        // Check uniqueness
        const dupCheck = await client.query(
            `SELECT tray_id FROM tray_master WHERE tray_no = $1`,
            [tray_no]
        );

        if (dupCheck.rows.length > 0) {
            throw new Error("Tray number already exists.");
        }

        // Insert tray
        const trayResult = await client.query(
            `INSERT INTO tray_master (tray_no, tray_name, total_positions) VALUES ($1, $2, $3) RETURNING tray_id`,
            [tray_no, tray_name || null, total_positions || 60]
        );

        const tray_id = trayResult.rows[0].tray_id;
        const positions = total_positions || 60;

        // Auto-create positions
        for (let i = 1; i <= positions; i++) {
            await client.query(
                `INSERT INTO tray_position (tray_id, position_no, status) VALUES ($1, $2, 'EMPTY')`,
                [tray_id, i]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: `Tray created with ${positions} positions.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const deactivateTrayS = async (tray_id) => {
    // Check no occupied positions
    const occupiedCheck = await pool.query(
        `SELECT COUNT(*) as count FROM tray_position WHERE tray_id = $1 AND status = 'OCCUPIED'`,
        [tray_id]
    );

    if (parseInt(occupiedCheck.rows[0].count) > 0) {
        throw new Error("Tray contains bobbins. Remove all bobbins before deactivating.");
    }

    await pool.query(
        `UPDATE tray_master SET is_active = FALSE WHERE tray_id = $1`,
        [tray_id]
    );

    return { success: true, message: "Tray deactivated." };
};

export const activateTrayS = async (tray_id) => {
    const result = await pool.query(
        `UPDATE tray_master SET is_active = TRUE WHERE tray_id = $1 RETURNING tray_id`,
        [tray_id]
    );

    if (result.rowCount === 0) {
        return { success: false, message: "Tray not found", notFound: true };
    }

    return { success: true, message: "Tray activated successfully" };
};

export const updateTrayNameS = async (tray_id, tray_name) => {
    const result = await pool.query(
        `UPDATE tray_master SET tray_name = $1 WHERE tray_id = $2 RETURNING tray_id`,
        [tray_name, tray_id]
    );

    if (result.rowCount === 0) {
        return { success: false, message: "Tray not found", notFound: true };
    }

    return { success: true, message: "Tray name updated successfully" };
};

export const getPositionsS = async (tray_id) => {
    const result = await pool.query(
        `SELECT * FROM tray_position WHERE tray_id = $1 ORDER BY position_no`,
        [tray_id]
    );
    return result.rows;
};

export const addPositionsS = async (tray_id, count) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const maxResult = await client.query(
            `SELECT COALESCE(MAX(position_no), 0) as max_pos FROM tray_position WHERE tray_id = $1`,
            [tray_id]
        );

        const maxPos = parseInt(maxResult.rows[0].max_pos);

        for (let i = maxPos + 1; i <= maxPos + count; i++) {
            await client.query(
                `INSERT INTO tray_position (tray_id, position_no, status) VALUES ($1, $2, 'EMPTY')`,
                [tray_id, i]
            );
        }

        await client.query(
            `UPDATE tray_master SET total_positions = total_positions + $1 WHERE tray_id = $2`,
            [count, tray_id]
        );

        await client.query("COMMIT");
        return { success: true, message: `${count} positions added.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const removePositionsS = async (tray_id, count) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Get last N positions
        const lastPositions = await client.query(
            `SELECT position_no, status FROM tray_position WHERE tray_id = $1 ORDER BY position_no DESC LIMIT $2`,
            [tray_id, count]
        );

        // Check all are EMPTY
        const occupied = lastPositions.rows.find(p => p.status === 'OCCUPIED');
        if (occupied) {
            throw new Error(`Position ${occupied.position_no} contains a bobbin. Remove the bobbin before deleting.`);
        }

        const minPosToDelete = lastPositions.rows[lastPositions.rows.length - 1].position_no;

        await client.query(
            `DELETE FROM tray_position WHERE tray_id = $1 AND position_no >= $2`,
            [tray_id, minPosToDelete]
        );

        await client.query(
            `UPDATE tray_master SET total_positions = total_positions - $1 WHERE tray_id = $2`,
            [count, tray_id]
        );

        await client.query("COMMIT");
        return { success: true, message: `${count} positions removed.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
