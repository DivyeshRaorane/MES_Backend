import pool from "../../db/postgres.js";

export const mbendReassignS = async (bobbin_no) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Step 0 — Validate: Find the PT Entry record
        const ptResult = await client.query(
            `SELECT * FROM pt_entry WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (ptResult.rows.length === 0) {
            return { success: false, message: "Bobbin not found in pt_entry" };
        }

        const failedEntry = ptResult.rows[0];
        const spool_id = failedEntry.spool_id;

        // Check if this bobbin is a sample
        if (failedEntry.is_sample !== true) {
            return { success: true, reassigned: false, message: "Bobbin is not a sample. No reassignment needed." };
        }

        // Confirm temp_grade is FAIL or REW
        const qcResult = await client.query(
            `SELECT temp_grade FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (qcResult.rows.length > 0) {
            const grade = qcResult.rows[0].temp_grade;
            if (grade !== 'FAIL' && grade !== 'REW') {
                return { success: true, reassigned: false, message: "Bobbin temp_grade is not FAIL/REW. No reassignment needed." };
            }
        }

        // Step 1 — Remove sample from failed bobbin (keep full_mbend = true)
        await client.query(
            `UPDATE pt_entry SET is_sample = false WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        
        // Get all PT entries for this spool in order, starting AFTER the failed sample
        const allEntries = await client.query(
            `SELECT pt_entry_id, bobbin_no, fid, pt_length, is_sample, full_mbend, no
             FROM pt_entry
             WHERE spool_id = $1 AND pt_entry_id > $2
             ORDER BY pt_entry_id ASC`,
            [spool_id, failedEntry.pt_entry_id]
        );

        const entries = allEntries.rows;

        if (entries.length === 0) {
            await client.query("COMMIT");
            return { success: true, reassigned: false, message: "No eligible next sample found yet. Will be assigned on next PT entry." };
        }

        // Step 2 — Find the next eligible sample (first bobbin with valid FID — no length minimum)
        let newSampleIdx = -1;
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const hasValidFid = e.fid && e.fid.trim() !== '';
            if (hasValidFid) {
                newSampleIdx = i;
                break;
            }
        }

        if (newSampleIdx === -1) {
            await client.query("COMMIT");
            return { success: true, reassigned: false, message: "No eligible next sample found yet. Will be assigned on next PT entry." };
        }

        // Mark the new sample
        const newSample = entries[newSampleIdx];
        await client.query(
            `UPDATE pt_entry SET is_sample = true, full_mbend = true WHERE pt_entry_id = $1`,
            [newSample.pt_entry_id]
        );

        console.log(`[MBendReassign] New sample assigned: ${newSample.bobbin_no}`);

        let recordsUpdated = 1; // counting the new sample

        // Step 3 & 4 — Restart 200 km MBend cycle from the new sample
        // Process all entries AFTER the new sample
        let currentIdx = newSampleIdx + 1;

        while (currentIdx < entries.length) {
            // Phase 1: Count 200 km of valid FID bobbins (these get full_mbend = false)
            let cumulativeLength = 0;

            while (currentIdx < entries.length && cumulativeLength < 200) {
                const e = entries[currentIdx];
                const hasValidFid = e.fid && e.fid.trim() !== '';

                if (hasValidFid) {
                    // Within 200 km window: full_mbend = false
                    if (e.full_mbend !== false) {
                        await client.query(
                            `UPDATE pt_entry SET full_mbend = false WHERE pt_entry_id = $1`,
                            [e.pt_entry_id]
                        );
                        recordsUpdated++;
                    }
                    cumulativeLength += parseFloat(e.pt_length) || 0;
                }

                currentIdx++;
            }

            // Phase 2: After 200 km, the next bobbin with valid FID becomes the new sample
            // Non-sample bobbins always keep full_mbend = false
            let foundNextSample = false;

            while (currentIdx < entries.length) {
                const e = entries[currentIdx];
                const hasValidFid = e.fid && e.fid.trim() !== '';

                if (hasValidFid) {
                    // This becomes the next sample
                    await client.query(
                        `UPDATE pt_entry SET is_sample = true, full_mbend = true WHERE pt_entry_id = $1`,
                        [e.pt_entry_id]
                    );
                    recordsUpdated++;
                    currentIdx++;
                    foundNextSample = true;
                    
                    break;
                } else {
                    currentIdx++;
                }
            }

            // If no next sample found, we've run out of records. Stop.
            if (!foundNextSample) break;
        }

        await client.query("COMMIT");

        return {
            success: true,
            reassigned: true,
            message: "MBend cycle reassigned successfully.",
            failed_sample_bobbin: bobbin_no,
            new_sample_bobbin: newSample.bobbin_no,
            records_updated: recordsUpdated
        };

    } catch (error) {
        await client.query("ROLLBACK");
        console.error('[MBendReassign] Error:', error);
        throw error;
    } finally {
        client.release();
    }
};
