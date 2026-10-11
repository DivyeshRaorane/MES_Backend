import pool from "../../db/postgres.js";

/**
 * Preform-based bobbin traceability.
 *
 * Flow:
 *  1. From a bobbin_no, find its preform_id (bobbin_entries).
 *  2. From that preform_id, find all spools drawn from it (draw_entry).
 *  3. For every spool, find all sibling bobbins (bobbin_entries).
 *  4. For every sibling bobbin, pull its full QC data (qc_entry_temp).
 *
 * Returns a structured object with the resolved preform, the sibling
 * bobbin summary rows and the matching qc_entry_temp rows.
 */
export const getPreformTraceabilityS = async (bobbinNo) => {
    if (!bobbinNo) {
        throw new Error("bobbin_no is required");
    }

    // 1. preform_id for the requested bobbin
    const preformRes = await pool.query(
        `SELECT preform_id FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbinNo]
    );

    if (preformRes.rows.length === 0) {
        return { bobbin_no: bobbinNo, preform_id: null, spool_ids: [], bobbins: [], qc_entries: [] };
    }

    const preformId = preformRes.rows[0].preform_id;

    // 2. all spools drawn from that preform
    const spoolRes = await pool.query(
        `SELECT DISTINCT spool_id FROM draw_entry WHERE preform_id = $1`,
        [preformId]
    );
    const spoolIds = spoolRes.rows.map((r) => r.spool_id).filter(Boolean);

    if (spoolIds.length === 0) {
        return { bobbin_no: bobbinNo, preform_id: preformId, spool_ids: [], bobbins: [], qc_entries: [] };
    }

    // 3. all sibling bobbins produced from those spools
    const bobbinRes = await pool.query(
        `SELECT bobbin_no,
                fid,
                product_type,
                fiber_length  AS pt_length,
                optical_length,
                temp_grade,
                final_grade,
                tower_no,
                pt_machine_no AS t_machine_no,
                spool_id,
                preform_id
           FROM bobbin_entries
          WHERE spool_id = ANY($1::varchar[])
          ORDER BY spool_id, bobbin_no`,
        [spoolIds]
    );
    const bobbins = bobbinRes.rows;

    const bobbinNos = bobbins.map((b) => b.bobbin_no).filter(Boolean);

    // 4. full QC data for each sibling bobbin
    let qcEntries = [];
    if (bobbinNos.length > 0) {
        const qcRes = await pool.query(
            `SELECT * FROM qc_entry_temp
              WHERE bobbin_no = ANY($1::varchar[])
              ORDER BY bobbin_no`,
            [bobbinNos]
        );
        qcEntries = qcRes.rows;
    }

    return {
        bobbin_no: bobbinNo,
        preform_id: preformId,
        spool_ids: spoolIds,
        bobbins,
        qc_entries: qcEntries,
    };
};
