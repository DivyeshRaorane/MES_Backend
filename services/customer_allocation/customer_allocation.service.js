import pool from "../../db/postgres.js";
import { getEffectiveLength } from "../../utils/opticalLengthHelper.js";

// Top/Bottom pairs — if bottom is null but top has value, use top value for comparison
const topBottomPairs = [
    { top: 'mfd_1310_top', bottom: 'mfd_1310_bottom' },
    { top: 'mfd_1550_top', bottom: 'mfd_1550_bottom' },
    { top: 'cut_off_top', bottom: 'cut_off_bottom' },
    { top: 'clad_dia_top', bottom: 'clad_dia_bottom' },
    { top: 'core_clad_concentricity_top', bottom: 'core_clad_concentricity_bottom' },
    { top: 'clad_ovality_top', bottom: 'clad_ovality_bottom' },
    { top: 'core_dia_top', bottom: 'core_dia_bottom' },
    { top: 'core_ovality_top', bottom: 'core_ovality_bottom' },
    { top: 'primary_coating_dia_top', bottom: 'primary_coating_dia_bottom' },
    { top: 'secondary_coating_dia_top', bottom: 'secondary_coating_dia_bottom' },
    { top: 'primary_coating_concentricity_top', bottom: 'primary_coating_concentricity_bottom' },
    { top: 'secondary_coating_concentricity_top', bottom: 'secondary_coating_concentricity_bottom' },
    { top: 'coating_ovality_top', bottom: 'coating_ovality_bottom' },
    { top: 'fiber_curl_top', bottom: 'fiber_curl_bottom' },
    { top: 'curl_defection_top', bottom: 'curl_defection_bottom' }
];

// Apply top/bottom copy logic to QC data
function applyTopBottomCopy(qcData) {
    for (const pair of topBottomPairs) {
        const topVal = qcData[pair.top];
        const bottomVal = qcData[pair.bottom];
        if ((bottomVal === null || bottomVal === undefined || bottomVal === '') &&
            (topVal !== null && topVal !== undefined && topVal !== '')) {
            qcData[pair.bottom] = topVal;
        }
    }
    return qcData;
}

// Fixed list of parameters to check (same as qc_grade engine) — used as FALLBACK if spec_mandatory has no entry
const defaultParametersToCheck = [
  'avg_lsa_atn_1310', 'avg_lsa_atn_1550', 'avg_lsa_atn_1625', 'avg_lsa_atn_1383',
  'spec_1285_1330' , 'mfd_1310_top', 'mfd_1310_bottom', 'mfd_1550_top', 'mfd_1550_bottom',
  'cut_off_top', 'cut_off_bottom', 'core_clad_concentricity_top', 'core_clad_concentricity_bottom',
  'clad_ovality_top', 'clad_ovality_bottom', 'core_ovality_top', 'core_ovality_bottom',
   'clad_dia_top', 'clad_dia_bottom', 'primary_coating_dia_top', 'primary_coating_dia_bottom',
   'secondary_coating_dia_top', 'secondary_coating_dia_bottom', 'primary_coating_concentricity_top', 'primary_coating_concentricity_bottom',
   'secondary_coating_concentricity_top', 'secondary_coating_concentricity_bottom', 'coating_ovality_top', 'coating_ovality_bottom',
   'fiber_curl_top', 'fiber_curl_bottom', 'zero_disp_wave', 'slope_zero_disp', 
   'disp_1550', 'disp_1285_1330', 'disp_1270_1360', 'pmd_1310', 
   'pmd_1550', 'disp_1575', 'disp_1460', 'disp_1490', 
   'spike_1310_size', 'spike_1550_size', 'cable_cut_off', 'disp_1625', 
   'disp_1570', 'slope_1550', 'slope_1290', 'slope_1490',
   'm_1T_10mm_1550', 'm_1T_10mm_1625', 'm_1T_15mm_1550', 'm_1T_15mm_1625',
   'm_1T_20mm_1550', 'm_1T_20mm_1625', 'm_10T_30mm_1550', 'm_10T_30mm_1625',
   'm_1T_32mm_1550', 'm_1T_32mm_1625', 'm_100T_50mm_1550', 'm_100T_50mm_1310', 
   'm_100T_50mm_1625', 'm_100T_60mm_1550', 'm_100T_60mm_1625',
]

export const runAllocationS = async (spec_ids) => {
    // Ensure spec_ids are integers
    const specIdsInt = spec_ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));

    // Step 1: Load selected specs sorted by priority
    const specResult = await pool.query(
        `SELECT sm.*, bc.bobbin_color_name AS fiber_color_name
         FROM spec_master sm
         LEFT JOIN bobbin_color bc ON CAST(NULLIF(sm.fiber_color, '') AS INTEGER) = bc.bobbin_color_id
         WHERE sm.spec_id = ANY($1::int[]) AND sm.is_active = TRUE 
         ORDER BY sm.priority ASC, sm.spec_id ASC`,
        [specIdsInt]
    );
    const specs = specResult.rows;

    if (specs.length === 0) {
        throw new Error("No active specifications found for the selected IDs.");
    }

    // Step 1b: Load spec_mandatory params for all selected spec_ids
    const mandatoryResult = await pool.query(
        `SELECT spec_id, mandatory_params FROM spec_mandatory WHERE spec_id = ANY($1::int[])`,
        [specIdsInt]
    );
    const specMandatoryMap = {};
    for (const row of mandatoryResult.rows) {
        // mandatory_params is stored as JSONB array — pg driver returns it as JS array directly
        specMandatoryMap[row.spec_id] = Array.isArray(row.mandatory_params)
            ? row.mandatory_params
            : [];
    }

    // Step 2: Get all eligible bobbins
    const ptStrains = [
    ...new Set(
        specs
            .map(s => parseInt(s.pt_strain, 10))
            .filter(n => !isNaN(n))
    )
];
    const productTypes = [...new Set(specs.map(s => s.product_type).filter(Boolean))];

    let bobbinQuery = `
        SELECT be.bobbin_no, be.fid, be.optical_length, be.pt_strain, be.product_type,
               be.preform_vendor_id, be.fiber_color,
               be.drawn_date, be.created_at
        FROM bobbin_entries be
        WHERE be.is_qc_out = TRUE
        AND (be.dispatch_status = 'NO' OR be.dispatch_status IS NULL)
    `;
    const queryParams = [];

    if (ptStrains.length > 0) {
        queryParams.push(ptStrains);
        bobbinQuery += ` AND be.pt_strain = ANY($${queryParams.length}::int[])`;
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
        const specAllocated = [];

        // Get parametersToCheck from spec_mandatory for this spec_id (fallback to default list)
        const parametersToCheck = specMandatoryMap[spec.spec_id] && specMandatoryMap[spec.spec_id].length > 0
            ? specMandatoryMap[spec.spec_id]
            : defaultParametersToCheck;

        // Dynamically determine which parameters to check from this spec
        // Only check parameters that are in parametersToCheck AND have at least one limit defined
        const paramsToCheck = [];

        for (const paramName of parametersToCheck) {
            const minVal = spec[`min_${paramName}`];
            const maxVal = spec[`max_${paramName}`];

            if (minVal !== null && minVal !== undefined) {
                paramsToCheck.push({ paramName, min: parseFloat(minVal), max: maxVal !== null && maxVal !== undefined ? parseFloat(maxVal) : null });
            } else if (maxVal !== null && maxVal !== undefined) {
                paramsToCheck.push({ paramName, min: null, max: parseFloat(maxVal) });
            }
        }

        // Filter bobbins for this spec
        const eligible = availableBobbins.filter(b => {
            if (allocatedPool.has(b.bobbin_no)) return false;
            if (spec.pt_strain && String(b.pt_strain) !== String(spec.pt_strain)) return false;
            if (spec.product_type && b.product_type !== spec.product_type) return false;
            if (spec.preform_vendor_id && Number(b.preform_vendor_id) !== Number(spec.preform_vendor_id)) return false;
            const fiberValue = (b.fiber_color || '').trim().toUpperCase();

    let bobbinColorType = '';
    let bobbinColor = '';

    if (fiberValue === 'NATURAL') {
        bobbinColorType = 'NATURAL';
        bobbinColor = 'NATURAL';
    } else if (fiberValue.startsWith('RM ')) {
        bobbinColorType = 'RM';
        bobbinColor = fiberValue.substring(3).trim();   // RM RED -> RED
    } else {
        bobbinColorType = 'COLORED';
        bobbinColor = fiberValue;                       // RED -> RED
    }

    // Fiber Type
    if (
        spec.color_type &&
        bobbinColorType !== spec.color_type.toUpperCase()
    )
        return false;

    // Fiber Color
    if (
        spec.fiber_color_name &&
        bobbinColor !== spec.fiber_color_name.toUpperCase()
    )
        return false;

            return true;
        });

        // Optical length allocation config for this spec
        const allocationRatio = spec.allocation_ratio ? parseFloat(spec.allocation_ratio) : null;
        const minimumLength = spec.minimum_length ? parseFloat(spec.minimum_length) : null;

        for (const bobbin of eligible) {
            if (allocatedPool.has(bobbin.bobbin_no)) continue;

            const qcData = qcMap[bobbin.bobbin_no];
            if (!qcData) continue;

            // Apply top/bottom copy (same as qc_grade engine)
            applyTopBottomCopy(qcData);

            // Validate only the parameters that have limits defined in this spec
            let passed = true;
            let failedParam = null;

            for (const param of paramsToCheck) {
                const qcValue = qcData[param.paramName];

                if (qcValue === null || qcValue === undefined) {
                    passed = false;
                    failedParam = { parameter: param.paramName, qc_value: null, min: param.min, max: param.max, reason: 'QC value is NULL' };
                    break;
                }

                const numVal = parseFloat(qcValue);

                if (param.min !== null && numVal < param.min) {
                    passed = false;
                    failedParam = { parameter: param.paramName, qc_value: numVal, min: param.min, max: param.max, reason: 'Below minimum' };
                    break;
                }

                if (param.max !== null && numVal > param.max) {
                    passed = false;
                    failedParam = { parameter: param.paramName, qc_value: numVal, min: param.min, max: param.max, reason: 'Exceeds maximum' };
                    break;
                }
            }

            if (passed) {
                // Optical Length Based Allocation check (only if spec has allocation_ratio)
                if (allocationRatio) {
                    // Use optical_length from bobbin_entries; if null, fall back to qc_entry optical_length
                    const rawOpticalLength = (bobbin.optical_length !== null && bobbin.optical_length !== undefined)
                        ? bobbin.optical_length
                        : qcData.optical_length;

                    const opticalLength = rawOpticalLength !== null && rawOpticalLength !== undefined
                        ? parseFloat(rawOpticalLength)
                        : null;

                    const effectiveLength = getEffectiveLength(opticalLength, allocationRatio);

                    // Reject if effective length is null (below one unit of ratio)
                    if (effectiveLength === null) {
                        allRejected.push({
                            bobbin_no: bobbin.bobbin_no,
                            spec_id: spec.spec_id,
                            reason: 'Below Minimum Allocation Length',
                            optical_length: opticalLength,
                            effective_length: null,
                            required_minimum_length: minimumLength,
                        });
                        continue;
                    }

                    // Reject if effective length is below spec minimum_length
                    if (minimumLength && effectiveLength < minimumLength) {
                        allRejected.push({
                            bobbin_no: bobbin.bobbin_no,
                            spec_id: spec.spec_id,
                            reason: 'Below Minimum Allocation Length',
                            optical_length: opticalLength,
                            effective_length: effectiveLength,
                            required_minimum_length: minimumLength,
                        });
                        continue;
                    }

                    // Passed optical length check — allocate with optical length info
                    allocatedPool.add(bobbin.bobbin_no);
                    specAllocated.push({ ...bobbin, effective_length: effectiveLength });
                    allAllocated.push({
                        ...bobbin,
                        assigned_spec: spec.cust_spec_name,
                        spec_id: spec.spec_id,
                        draw_date: bobbin.drawn_date || bobbin.created_at?.toString().split('T')[0],
                        optical_length: opticalLength,
                        effective_length: effectiveLength,
                        allocation_ratio: allocationRatio,
                        allocated_length_label: `Allocated as ${effectiveLength} km`,
                    });
                } else {
                    // No optical length allocation — existing behavior
                    allocatedPool.add(bobbin.bobbin_no);
                    specAllocated.push(bobbin);
                    allAllocated.push({
                        ...bobbin,
                        assigned_spec: spec.cust_spec_name,
                        spec_id: spec.spec_id,
                        draw_date: bobbin.drawn_date || bobbin.created_at?.toString().split('T')[0],
                    });
                }
            } else {
                allRejected.push({
                    bobbin_no: bobbin.bobbin_no,
                    spec_id: spec.spec_id,
                    failed_parameter: failedParam.parameter,
                    qc_value: failedParam.qc_value,
                    spec_min: failedParam.min,
                    spec_max: failedParam.max,
                    reason: failedParam.reason,
                });
            }   
        }

        // Build length summary if optical length allocation is active for this spec
        let lengthSummary = [];
        let totalAllocatedKm = 0;

        if (allocationRatio) {
            const lengthGroups = {};
            for (const b of specAllocated) {
                const el = b.effective_length;
                if (el !== null && el !== undefined) {
                    if (!lengthGroups[el]) {
                        lengthGroups[el] = { effective_length: el, bobbin_count: 0, total_allocated_km: 0 };
                    }
                    lengthGroups[el].bobbin_count += 1;
                    lengthGroups[el].total_allocated_km = Math.round(lengthGroups[el].effective_length * lengthGroups[el].bobbin_count * 10) / 10;
                }
            }
            lengthSummary = Object.values(lengthGroups).sort((a, b) => a.effective_length - b.effective_length);
            totalAllocatedKm = lengthSummary.reduce((sum, g) => sum + g.total_allocated_km, 0);
            totalAllocatedKm = Math.round(totalAllocatedKm * 10) / 10;
        }

        const specResultEntry = {
            spec_id: spec.spec_id,
            customer_name: spec.customer_name,
            cust_spec_name: spec.cust_spec_name,
            po_number: spec.po_number,
            pt_strain: spec.pt_strain,
            product_type: spec.product_type,
            priority: spec.priority,
            bobbin_count: specAllocated.length,
            parameters_checked: paramsToCheck.length,
        };

        // Add optical length summary fields if allocation_ratio is set
        if (allocationRatio) {
            specResultEntry.allocated_bobbins = specAllocated.length;
            specResultEntry.total_allocated_km = totalAllocatedKm;
            specResultEntry.length_summary = lengthSummary;
        }

        specResults.push(specResultEntry);
    }

    // Step 5: Attach tray position for each allocated bobbin
    // Format: tray_name-tray_no-position_no (from tray_position joined with tray_master)
    const allocatedBobbinNos = allAllocated.map(a => a.bobbin_no);
    if (allocatedBobbinNos.length > 0) {
        const positionResult = await pool.query(
            `SELECT tp.bobbin_no, tp.position_no, tm.tray_no, tm.tray_name
             FROM tray_position tp
             JOIN tray_master tm ON tp.tray_id = tm.tray_id
             WHERE tp.bobbin_no = ANY($1)`,
            [allocatedBobbinNos]
        );

        const positionMap = {};
        for (const row of positionResult.rows) {
            positionMap[row.bobbin_no] = `${row.tray_name}-${row.tray_no}-${row.position_no}`;
        }

        for (const a of allAllocated) {
            a.position = positionMap[a.bobbin_no] || null;
        }
    }

    return { specs: specResults, allocated: allAllocated, rejected: allRejected };
};
