import pool from "../../db/postgres.js";

// ─── Get all packing orders for selection ───
export const getPackingOrdersS = async () => {
    const result = await pool.query(`
        SELECT order_no, customer_name, required_km, box_capacity, stack_capacity,
               created_at, COALESCE(tc_generated, FALSE) as tc_generated
        FROM packing_order
        ORDER BY created_at DESC
    `);
    return result.rows;
};

// ─── Load packing order header + bobbins + QC data ───
export const loadPackingOrderS = async (orderNo) => {
    // Get packing order header (include tc_generated flag)
    const headerResult = await pool.query(
        'SELECT *, COALESCE(tc_generated, FALSE) as tc_generated FROM packing_order WHERE order_no = $1', [orderNo]
    );

    if (headerResult.rows.length === 0) {
        throw new Error('Packing Order not found');
    }

    // Get bobbins with QC data via LEFT JOIN
    const bobbinResult = await pool.query(`
        SELECT
            pob.bobbin_no, pob.length_km, pob.box_no, pob.stack_no,
            qc.*
        FROM packing_order_bobbin pob
        LEFT JOIN qc_entry qc ON qc.bobbin_no = pob.bobbin_no
        WHERE pob.packing_order = $1
        ORDER BY pob.box_no, pob.stack_no, pob.bobbin_no
    `, [orderNo]);

    return {
        header: headerResult.rows[0],
        bobbins: bobbinResult.rows,
    };
};

// ─── Save TC (header + detail) in a transaction ───
export const saveTcS = async (payload, userId) => {
    const client = await pool.connect();

    try {
        const {
            packing_order, tc_number, tc_date, customer_ref,
            inspection_date, inspection_by, approved_by, remarks,
            revision, version, total_km, total_bobbins,
            spec_values, bobbins
        } = payload;

        if (!tc_number) throw new Error('TC Number is required');
        if (!packing_order) throw new Error('Packing Order is required');

        await client.query('BEGIN');

        // Check if TC already generated for this order
        const dupCheck = await client.query(
            'SELECT tc_generated FROM packing_order WHERE order_no = $1',
            [packing_order]
        );

        if (dupCheck.rows.length === 0) {
            throw new Error('Packing Order not found');
        }

        if (dupCheck.rows[0].tc_generated === true) {
            throw new Error('TC already generated for this order');
        }

        // Insert TC Header
        const headerResult = await client.query(`
            INSERT INTO tc_header (
                packing_order, tc_number, tc_date, customer_ref,
                inspection_date, inspection_by, approved_by, remarks,
                revision, version, total_km, total_bobbins,
                mb_1turn, mb_10turn, mech_proof, mech_coat, mech_aged, mech_unaged,
                env_temp, env_thc, env_htha, env_water, env_accel,
                opc_egir, opc_attn1, opc_attn2, opc_pd, opc_nd,
                created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
                $24, $25, $26, $27, $28, $29
            ) RETURNING tc_id
        `, [
            packing_order, tc_number, tc_date || null, customer_ref || null,
            inspection_date || null, inspection_by || null, approved_by || null, remarks || null,
            revision || '0', version || '1.0', total_km || 0, total_bobbins || 0,
            spec_values?.mb_1turn || null, spec_values?.mb_10turn || null,
            spec_values?.mech_proof || null, spec_values?.mech_coat || null,
            spec_values?.mech_aged || null, spec_values?.mech_unaged || null,
            spec_values?.env_temp || null, spec_values?.env_thc || null,
            spec_values?.env_htha || null, spec_values?.env_water || null,
            spec_values?.env_accel || null,
            spec_values?.opc_egir || null, spec_values?.opc_attn1 || null,
            spec_values?.opc_attn2 || null, spec_values?.opc_pd || null,
            spec_values?.opc_nd || null,
            userId || null
        ]);

        const tc_id = headerResult.rows[0].tc_id;

        // Insert TC Detail rows (one per bobbin with QC snapshot)
        if (bobbins && bobbins.length > 0) {
            for (const bobbin of bobbins) {
                const { bobbin_no, bobbin_fid, length_km, box_no, stack_no, ...qcFields } = bobbin;

                await client.query(`
                    INSERT INTO tc_detail (tc_id, bobbin_no, bobbin_fid, length_km, box_no, stack_no, qc_data)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    tc_id,
                    bobbin_no || null,
                    bobbin_fid || null,
                    length_km || null,
                    box_no || null,
                    stack_no || null,
                    JSON.stringify(qcFields)
                ]);
            }
        }

        // Mark packing order as TC generated
        await client.query(
            'UPDATE packing_order SET tc_generated = TRUE, updated_at = CURRENT_TIMESTAMP WHERE order_no = $1',
            [packing_order]
        );

        await client.query('COMMIT');

        return { tc_id };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ─── List all saved TCs ───
export const listTcS = async () => {
    const result = await pool.query(`
        SELECT tc_id, packing_order, tc_number, tc_date, total_km, total_bobbins, created_at
        FROM tc_header
        WHERE is_active = TRUE
        ORDER BY created_at DESC
    `);
    return result.rows;
};

// ─── Get full TC (header + detail) ───
export const getTcByIdS = async (tcId) => {
    const headerResult = await pool.query(
        'SELECT * FROM tc_header WHERE tc_id = $1', [tcId]
    );

    if (headerResult.rows.length === 0) {
        throw new Error('TC not found');
    }

    const detailResult = await pool.query(
        'SELECT * FROM tc_detail WHERE tc_id = $1 ORDER BY box_no, stack_no, bobbin_no',
        [tcId]
    );

    return {
        header: headerResult.rows[0],
        bobbins: detailResult.rows,
    };
};
