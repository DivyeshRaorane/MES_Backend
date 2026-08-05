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
         WHERE attn_1240_before IS NULL
         GROUP BY h2_batch_id, d2_batch_id, h2_date, h2_operator`
    );
    return result.rows;
};

export const getPendingAfterS = async () => {
    const result = await pool.query(
        `SELECT h2_batch_id, d2_batch_id, h2_date, h2_operator, COUNT(*) as total_bobbins
         FROM h2_ageing
         WHERE attn_1240_before IS NOT NULL AND attn_1240_after IS NULL
         GROUP BY h2_batch_id, d2_batch_id, h2_date, h2_operator`
    );
    return result.rows;
};

export const getPending14DayS = async () => {
    const result = await pool.query(
        `SELECT h2_batch_id, d2_batch_id, h2_date, h2_operator, COUNT(*) as total_bobbins
         FROM h2_ageing
         WHERE attn_1240_after IS NOT NULL AND attn_1240_14_days IS NULL
         GROUP BY h2_batch_id, d2_batch_id, h2_date, h2_operator`
    );
    return result.rows;
};

export const getBobbinsForBatchS = async (h2_batch_id) => {
    const result = await pool.query(
        `SELECT h2_ageing_id AS h2_id, h2_batch_id, bobbin_no, d2_batch_id, h2_date, h2_operator,
                attn_1240_before, attn_1310_before, attn_1383_before, attn_1550_before, attn_1625_before,
                before_operator, before_date, before_time,
                attn_1240_after, attn_1310_after, attn_1383_after, attn_1550_after, attn_1625_after,
                after_operator, after_date, after_time,
                attn_1240_14_days, attn_1310_14_days, attn_1383_14_days, attn_1550_14_days, attn_1625_14_days,
                date_14_day_operator, date_14_day, time_14_day
         FROM h2_ageing WHERE h2_batch_id = $1 ORDER BY bobbin_no`,
        [h2_batch_id]
    );
    return result.rows;
};

export const saveBeforeEntryS = async (payload) => {
    const { h2_batch_id, operator, date, time, bobbins, logged_in_user } = payload;

    // Validate h2_batch_id exists
    const batchCheck = await pool.query(
        `SELECT h2_ageing_id FROM h2_ageing WHERE h2_batch_id = $1 LIMIT 1`,
        [h2_batch_id]
    );
    if (batchCheck.rows.length === 0) {
        throw new Error("H2 batch not found.");
    }

    // Validate bobbins array
    if (!bobbins || !Array.isArray(bobbins) || bobbins.length === 0) {
        throw new Error("Bobbins array is required and must not be empty.");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const bobbin of bobbins) {
            const { bobbin_no, h2_id, readings } = bobbin;

            if (!bobbin_no || !h2_id || !readings) {
                throw new Error(`Invalid bobbin data: bobbin_no, h2_id, and readings are required.`);
            }

            const { attn_1240_before, attn_1310_before, attn_1383_before, attn_1550_before, attn_1625_before } = readings;

            if (attn_1240_before == null || attn_1310_before == null || attn_1383_before == null ||
                attn_1550_before == null || attn_1625_before == null) {
                throw new Error(`All 5 reading fields are required for bobbin ${bobbin_no}.`);
            }

            const result = await client.query(
                `UPDATE h2_ageing
                 SET attn_1240_before = $1, attn_1310_before = $2, attn_1383_before = $3,
                     attn_1550_before = $4, attn_1625_before = $5,
                     before_operator = $6, before_date = $7, before_time = $8,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE h2_batch_id = $9 AND h2_ageing_id = $10 AND bobbin_no = $11`,
                [attn_1240_before, attn_1310_before, attn_1383_before,
                 attn_1550_before, attn_1625_before,
                 operator, date, time,
                 h2_batch_id, h2_id, bobbin_no]
            );

            if (result.rowCount === 0) {
                throw new Error(`No matching row found for bobbin ${bobbin_no} with h2_id ${h2_id} in batch ${h2_batch_id}.`);
            }
        }

        await client.query("COMMIT");
        return { success: true, message: `Before entry readings saved for ${bobbins.length} bobbins.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const saveAfterEntryS = async (payload) => {
    const { h2_batch_id, operator, date, time, bobbins, logged_in_user } = payload;

    // Validate h2_batch_id exists
    const batchCheck = await pool.query(
        `SELECT h2_ageing_id FROM h2_ageing WHERE h2_batch_id = $1 LIMIT 1`,
        [h2_batch_id]
    );
    if (batchCheck.rows.length === 0) {
        throw new Error("H2 batch not found.");
    }

    // Validate bobbins array
    if (!bobbins || !Array.isArray(bobbins) || bobbins.length === 0) {
        throw new Error("Bobbins array is required and must not be empty.");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const bobbin of bobbins) {
            const { bobbin_no, h2_id, readings } = bobbin;

            if (!bobbin_no || !h2_id || !readings) {
                throw new Error(`Invalid bobbin data: bobbin_no, h2_id, and readings are required.`);
            }

            const { attn_1240_after, attn_1310_after, attn_1383_after, attn_1550_after, attn_1625_after } = readings;

            if (attn_1240_after == null || attn_1310_after == null || attn_1383_after == null ||
                attn_1550_after == null || attn_1625_after == null) {
                throw new Error(`All 5 reading fields are required for bobbin ${bobbin_no}.`);
            }

            const result = await client.query(
                `UPDATE h2_ageing
                 SET attn_1240_after = $1, attn_1310_after = $2, attn_1383_after = $3,
                     attn_1550_after = $4, attn_1625_after = $5,
                     after_operator = $6, after_date = $7, after_time = $8,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE h2_batch_id = $9 AND h2_ageing_id = $10 AND bobbin_no = $11`,
                [attn_1240_after, attn_1310_after, attn_1383_after,
                 attn_1550_after, attn_1625_after,
                 operator, date, time,
                 h2_batch_id, h2_id, bobbin_no]
            );

            if (result.rowCount === 0) {
                throw new Error(`No matching row found for bobbin ${bobbin_no} with h2_id ${h2_id} in batch ${h2_batch_id}.`);
            }
        }

        // Mark bobbin_entries as h2_after complete
        const bobbinNos = bobbins.map(b => b.bobbin_no);
        await client.query(
            `UPDATE bobbin_entries SET is_h2_after = true WHERE bobbin_no = ANY($1)`,
            [bobbinNos]
        );

        await client.query("COMMIT");
        return { success: true, message: `After entry readings saved for ${bobbins.length} bobbins.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const save14DayEntryS = async (payload) => {
    const { h2_batch_id, operator, date, time, bobbins, logged_in_user } = payload;

    // Validate h2_batch_id exists
    const batchCheck = await pool.query(
        `SELECT h2_ageing_id FROM h2_ageing WHERE h2_batch_id = $1 LIMIT 1`,
        [h2_batch_id]
    );
    if (batchCheck.rows.length === 0) {
        throw new Error("H2 batch not found.");
    }

    // Validate bobbins array
    if (!bobbins || !Array.isArray(bobbins) || bobbins.length === 0) {
        throw new Error("Bobbins array is required and must not be empty.");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const bobbin of bobbins) {
            const { bobbin_no, h2_id, readings } = bobbin;

            if (!bobbin_no || !h2_id || !readings) {
                throw new Error(`Invalid bobbin data: bobbin_no, h2_id, and readings are required.`);
            }

            const { attn_1240_14_days, attn_1310_14_days, attn_1383_14_days, attn_1550_14_days, attn_1625_14_days } = readings;

            if (attn_1240_14_days == null || attn_1310_14_days == null || attn_1383_14_days == null ||
                attn_1550_14_days == null || attn_1625_14_days == null) {
                throw new Error(`All 5 reading fields are required for bobbin ${bobbin_no}.`);
            }

            const result = await client.query(
                `UPDATE h2_ageing
                 SET attn_1240_14_days = $1, attn_1310_14_days = $2, attn_1383_14_days = $3,
                     attn_1550_14_days = $4, attn_1625_14_days = $5,
                     date_14_day_operator = $6, date_14_day = $7, time_14_day = $8,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE h2_batch_id = $9 AND h2_ageing_id = $10 AND bobbin_no = $11`,
                [attn_1240_14_days, attn_1310_14_days, attn_1383_14_days,
                 attn_1550_14_days, attn_1625_14_days,
                 operator, date, time,
                 h2_batch_id, h2_id, bobbin_no]
            );

            if (result.rowCount === 0) {
                throw new Error(`No matching row found for bobbin ${bobbin_no} with h2_id ${h2_id} in batch ${h2_batch_id}.`);
            }
        }

        await client.query("COMMIT");
        return { success: true, message: `14-Day entry readings saved for ${bobbins.length} bobbins.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
