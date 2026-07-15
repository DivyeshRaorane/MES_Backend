import pool from "../../db/postgres.js";

export const runAllocationS = async (spec_ids) => {
    // Step 1: Load selected specs sorted by priority
    const specResult = await pool.query(
        `SELECT * FROM spec_master WHERE spec_id = ANY($1) AND is_active = TRUE ORDER BY priority ASC, spec_id ASC`,
        [spec_ids]
    );
    const specs = specResult.rows;

    // Load parameters for each spec
    const paramResult = await pool.query(
        `SELECT * FROM spec_parameter WHERE spec_id = ANY($1)`,
        [spec_ids]
    );

    const paramsBySpec = {};
    paramResult.rows.forEach(p => {
        if (!paramsBySpec[p.spec_id]) paramsBySpec[p.spec_id] = [];
        paramsBySpec[p.spec_id].push(p);
    });

    // Step 2: Get all eligible bobbins
    const ptStrains = [...new Set(specs.map(s => s.pt_strain).filter(Boolean))];
    const productTypes = [...new Set(specs.map(s => s.product_type).filter(Boolean))];

    let bobbinQuery = `
        SELECT be.bobbin_no, be.fid, be.fiber_length, be.pt_strain, be.product_type,
               be.drawn_date, be.created_at
        FROM bobbin_entries be
        WHERE be.is_qc_out = TRUE
        AND (be.dispatch_status = 'NO' OR be.dispatch_status IS NULL)
    `;
    const queryParams = [];

    if (ptStrains.length > 0) {
        queryParams.push(ptStrains);
        bobbinQuery += ` AND be.pt_strain = ANY($${queryParams.length})`;
    }
    if (productTypes.length > 0) {
        queryParams.push(productTypes);
        bobbinQuery += ` AND be.product_type = ANY($${queryParams.length})`;
    }

    bobbinQuery += ` ORDER BY be.created_at ASC`;

    const bobbinResult = await pool.query(bobbinQuery, queryParams);
    const availableBobbins = bobbinResult.rows;

    // Step 3: Load QC data for all eligible bobbins
    const bobbinNos = availableBobbins.map(b => b.bobbin_no);
    const qcMap = {};

    if (bobbinNos.length > 0) {
        const qcResult = await pool.query(
            `SELECT * FROM qc_entry WHERE bobbin_no = ANY($1)`,
            [bobbinNos]
        );
        qcResult.rows.forEach(qc => { qcMap[qc.bobbin_no] = qc; });
    }

    // Step 4: Process each spec by priority
    const allocatedPool = new Set();
    const specResults = [];
    const allAllocated = [];
    const allRejected = [];

    for (const spec of specs) {
        const params = paramsBySpec[spec.spec_id] || [];
        const requiredKm = parseFloat(spec.quantity_km) || 0;
        let allocatedKm = 0;
        const specAllocated = [];

        const eligible = availableBobbins.filter(b => {
            if (allocatedPool.has(b.bobbin_no)) return false;
            if (spec.pt_strain && String(b.pt_strain) !== String(spec.pt_strain)) return false;
            if (spec.product_type && b.product_type !== spec.product_type) return false;
            return true;
        });

        for (const bobbin of eligible) {
            if (allocatedKm >= requiredKm) break;
            if (allocatedPool.has(bobbin.bobbin_no)) continue;

            const qcData = qcMap[bobbin.bobbin_no];
            if (!qcData) continue;

            // Validate all parameters
            let passed = true;
            let failedParam = null;

            for (const param of params) {
                const qcValue = qcData[param.parameter_name];
                const minVal = param.min_value !== null ? parseFloat(param.min_value) : null;
                const maxVal = param.max_value !== null ? parseFloat(param.max_value) : null;

                if (minVal === null && maxVal === null) continue;

                if (qcValue === null || qcValue === undefined) {
                    passed = false;
                    failedParam = { parameter: param.parameter_name, qc_value: null, min: minVal, max: maxVal, reason: 'QC value is NULL' };
                    break;
                }

                const numVal = parseFloat(qcValue);

                if (minVal !== null && numVal < minVal) {
                    passed = false;
                    failedParam = { parameter: param.parameter_name, qc_value: numVal, min: minVal, max: maxVal, reason: 'Below minimum' };
                    break;
                }

                if (maxVal !== null && numVal > maxVal) {
                    passed = false;
                    failedParam = { parameter: param.parameter_name, qc_value: numVal, min: minVal, max: maxVal, reason: 'Exceeds maximum' };
                    break;
                }
            }

            if (passed) {
                allocatedPool.add(bobbin.bobbin_no);
                allocatedKm += parseFloat(bobbin.fiber_length) || 0;
                specAllocated.push(bobbin);
                allAllocated.push({
                    ...bobbin,
                    assigned_spec: spec.cust_spec_name,
                    draw_date: bobbin.drawn_date || bobbin.created_at?.toString().split('T')[0],
                });
            } else {
                allRejected.push({
                    bobbin_no: bobbin.bobbin_no,
                    failed_parameter: failedParam.parameter,
                    qc_value: failedParam.qc_value,
                    spec_min: failedParam.min,
                    spec_max: failedParam.max,
                    reason: failedParam.reason,
                });
            }
        }

        const remainingKm = Math.max(0, requiredKm - allocatedKm);
        specResults.push({
            spec_id: spec.spec_id,
            customer_name: spec.customer_name,
            cust_spec_name: spec.cust_spec_name,
            po_number: spec.po_number,
            pt_strain: spec.pt_strain,
            product_type: spec.product_type,
            priority: spec.priority,
            required_km: requiredKm,
            allocated_km: parseFloat(allocatedKm.toFixed(3)),
            remaining_km: parseFloat(remainingKm.toFixed(3)),
            bobbin_count: specAllocated.length,
            status: remainingKm <= 0 ? 'FULLY_ALLOCATED' : allocatedKm > 0 ? 'PARTIALLY_ALLOCATED' : 'WAITING_FOR_PRODUCTION',
        });
    }

    return { specs: specResults, allocated: allAllocated, rejected: allRejected };
};
