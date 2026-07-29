import pool from "../../db/postgres.js";

export const getChambersInUseS = async () => {
    const result = await pool.query(
        `SELECT * FROM d2_chamber WHERE is_active = false ORDER BY d2_chamber_no ASC`
    );
    return result.rows;
};

export const getBatchesForIssueS = async () => {
    const result = await pool.query(
        `SELECT DISTINCT d2_batch_id
         FROM d2_issue
         WHERE (is_h2 = FALSE OR is_h2 = 'false' OR is_h2 IS NULL)
         AND d2_end_date IS NOT NULL
         ORDER BY d2_batch_id`
    );
    return result.rows;
};

export const validateBobbinForH2S = async (bobbin_no, d2_batch_ids) => {
    // Check bobbin exists
    const bobbinResult = await pool.query(
        `SELECT bobbin_no, d2_batch_id, fiber_type, fiber_color, spool_id, preform_id, is_d2
         FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return { success: false, message: "Bobbin not found." };
    }

    const bobbin = bobbinResult.rows[0];

    // Check D2 completed
    if (bobbin.is_d2 !== true) {
        return { success: false, message: "D2 is not completed for this bobbin." };
    }

    // If d2_batch_ids provided, check bobbin belongs to one of them
    if (d2_batch_ids && d2_batch_ids.length > 0) {
        if (!d2_batch_ids.includes(bobbin.d2_batch_id)) {
            return { success: false, message: "This bobbin does not belong to the selected D2 Batch(es)." };
        }
    }

    // Check if already in h2_ageing
    const h2Check = await pool.query(
        `SELECT h2_ageing_id FROM h2_ageing WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (h2Check.rows.length > 0) {
        return { success: false, message: "H2 Issue has already been created for this bobbin." };
    }

    return { success: true, data: bobbin };
};

export const issueH2S = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { chamber, h2_batch_id, h2_date, h2_time, h2_operator, bobbins, logged_in_user } = payload;

        // Check h2_batch_id duplicate
        const dupCheck = await client.query(
            `SELECT h2_ageing_id FROM h2_ageing WHERE h2_batch_id = $1 LIMIT 1`,
            [h2_batch_id]
        );

        if (dupCheck.rows.length > 0) {
            throw new Error("This H2 Batch ID already exists. Please use a different ID.");
        }

        const bobbinNos = bobbins.map(b => b.bobbin_no);

        // Insert h2_ageing rows (each bobbin may have different d2_batch_id)
        for (const bobbin of bobbins) {
            await client.query(
                `INSERT INTO h2_ageing (d2_batch_id, h2_batch_id, bobbin_no, h2_date, h2_time, h2_operator, logged_in_user)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [bobbin.d2_batch_id, h2_batch_id, bobbin.bobbin_no, h2_date, h2_time, h2_operator, logged_in_user]
            );
        }

        // Mark d2_issue records as H2 issued (per bobbin, per batch)
        for (const bobbin of bobbins) {
            await client.query(
                `UPDATE d2_issue SET is_h2 = TRUE WHERE bobbin_no = $1 AND d2_batch_id = $2`,
                [bobbin.bobbin_no, bobbin.d2_batch_id]
            );
        }

        // Update bobbin_entries
        await client.query(
            `UPDATE bobbin_entries SET is_h2 = true, h2_batch_id = $1 WHERE bobbin_no = ANY($2)`,
            [h2_batch_id, bobbinNos]
        );

        await client.query("COMMIT");
        return { success: true, message: "H2 Issue created successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const getPendingBeforeS = async () => {
    const result = await pool.query(
        `SELECT h2_batch_id, d2_batch_id, h2_date, h2_operator, COUNT(*) as total_bobbins
         FROM h2_ageing
         WHERE before_date IS NULL
         GROUP BY h2_batch_id, d2_batch_id, h2_date, h2_operator`
    );
    return result.rows;
};

export const getPendingAfterS = async () => {
    const result = await pool.query(
        `SELECT h2_batch_id, d2_batch_id, h2_date, h2_operator, COUNT(*) as total_bobbins
         FROM h2_ageing
         WHERE before_date IS NOT NULL AND after_date IS NULL
         GROUP BY h2_batch_id, d2_batch_id, h2_date, h2_operator`
    );
    return result.rows;
};

export const getPending14DayS = async () => {
    const result = await pool.query(
        `SELECT h2_batch_id, d2_batch_id, h2_date, h2_operator, COUNT(*) as total_bobbins
         FROM h2_ageing
         WHERE after_date IS NOT NULL AND date_14_day IS NULL
         GROUP BY h2_batch_id, d2_batch_id, h2_date, h2_operator`
    );
    return result.rows;
};

export const getBobbinsForBatchS = async (h2_batch_id) => {
    const result = await pool.query(
        `SELECT * FROM h2_ageing WHERE h2_batch_id = $1 ORDER BY bobbin_no`,
        [h2_batch_id]
    );
    return result.rows;
};

export const saveBeforeEntryS = async (payload) => {
    const { h2_batch_id, operator, date, time, readings, logged_in_user } = payload;

    const result = await pool.query(
        `UPDATE h2_ageing
         SET before_date = $1, before_time = $2, before_operator = $3,
             attn_1240_before = $4, attn_1310_before = $5, attn_1383_before = $6,
             attn_1550_before = $7, attn_1625_before = $8, updated_at = CURRENT_TIMESTAMP
         WHERE h2_batch_id = $9`,
        [date, time, operator,
         readings.attn_1240_before, readings.attn_1310_before, readings.attn_1383_before,
         readings.attn_1550_before, readings.attn_1625_before, h2_batch_id]
    );

    if (result.rowCount === 0) {
        throw new Error("H2 batch not found.");
    }

    return { success: true, message: "Before entry saved successfully." };
};

export const saveAfterEntryS = async (payload) => {
    const { h2_batch_id, operator, date, time, readings, logged_in_user } = payload;

    const result = await pool.query(
        `UPDATE h2_ageing
         SET after_date = $1, after_time = $2, after_operator = $3,
             attn_1240_after = $4, attn_1310_after = $5, attn_1383_after = $6,
             attn_1550_after = $7, attn_1625_after = $8, updated_at = CURRENT_TIMESTAMP
         WHERE h2_batch_id = $9`,
        [date, time, operator,
         readings.attn_1240_after, readings.attn_1310_after, readings.attn_1383_after,
         readings.attn_1550_after, readings.attn_1625_after, h2_batch_id]
    );

    if (result.rowCount === 0) {
        throw new Error("H2 batch not found.");
    }

    // Get d2_batch_id(s) associated with this h2_batch_id
    const d2Result = await pool.query(
        `SELECT DISTINCT d2_batch_id FROM h2_ageing WHERE h2_batch_id = $1`,
        [h2_batch_id]
    );
    const d2BatchIds = d2Result.rows.map(r => r.d2_batch_id).filter(Boolean);

    // Mark is_h2_after = true for all bobbins in this h2_batch
    await pool.query(
        `UPDATE bobbin_entries SET is_h2_after = true WHERE bobbin_no IN (SELECT bobbin_no FROM h2_ageing WHERE h2_batch_id = $1)`,
        [h2_batch_id]
    );

    // Also mark is_h2_after = true for all bobbins that share the same d2_batch_id(s)
    if (d2BatchIds.length > 0) {
        await pool.query(
            `UPDATE bobbin_entries SET is_h2_after = true WHERE d2_batch_id = ANY($1)`,
            [d2BatchIds]
        );
    }

    return { success: true, message: "After entry saved successfully." };
};

export const save14DayEntryS = async (payload) => {
    const { h2_batch_id, operator, date, time, readings, logged_in_user } = payload;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE h2_ageing
             SET date_14_day = $1, time_14_day = $2, date_14_day_operator = $3,
                 attn_1240_14_days = $4, attn_1310_14_days = $5, attn_1383_14_days = $6,
                 attn_1550_14_days = $7, attn_1625_14_days = $8, updated_at = CURRENT_TIMESTAMP
             WHERE h2_batch_id = $9`,
            [date, time, operator,
             readings.attn_1240_14_days, readings.attn_1310_14_days, readings.attn_1383_14_days,
             readings.attn_1550_14_days, readings.attn_1625_14_days, h2_batch_id]
        );

        // Get d2_batch_id and bobbin_nos for this h2 batch — no further d2_issue update needed
        // is_h2 was already set to TRUE during H2 Issue

        await client.query("COMMIT");
        return { success: true, message: "14-Day entry saved successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
