import pool from "../../db/postgres.js";

/**
 * MFD 1550 & Cable Cutoff Auto-Calculation Service
 * 
 * Triggered when a bobbin is scanned and exists in qc_entry_temp.
 * 
 * Logic:
 * 
 * FOR G657A1 product types (G657A1250, G657A1200, G657A1180, G657A1160):
 *   - If mfd_1550_top AND mfd_1550_bottom are already available → skip MFD calculation
 *   - If mfd_1550_top is missing → calculate: mfd_1310_top + 1.16 → update mfd_1550_top
 *   - If mfd_1550_bottom is missing → calculate: mfd_1310_bottom + 1.16 → update mfd_1550_bottom
 *   - Cable cutoff: if cut_off value < 1330 → cable_cut_off = cut_off - 85
 *   - If cut_off value >= 1330 → return popup flag (Cable Cutoff Mandatory)
 * 
 * FOR G657A2 product types (G657A2250, etc.):
 *   - No MFD calculation
 *   - Cable cutoff: if cut_off value < 1300 → cable_cut_off = cut_off - 53
 *   - If cut_off value >= 1300 → return popup flag (Cable Cutoff Mandatory)
 */

// Product type prefix identifiers
const G657A1_PREFIX = 'G657A1';
const G657A2_PREFIX = 'G657A2';

// Cable cutoff thresholds and offsets
const G657A1_CUTOFF_THRESHOLD = 1330;
const G657A1_CUTOFF_OFFSET = 85;

const G657A2_CUTOFF_THRESHOLD = 1300;
const G657A2_CUTOFF_OFFSET = 53;

// MFD 1550 offset from MFD 1310
const MFD_1550_OFFSET = 1.16;

/**
 * Main function: Checks and auto-calculates MFD 1550 and cable_cut_off
 * for G657A1 and G657A2 product types.
 * 
 * @param {string} bobbin_no - The scanned bobbin number
 * @returns {object} Result with calculated values and popup flags
 */
export const mfdCableCutoffCalcS = async (bobbin_no) => {
    // Step 1: Get bobbin data from qc_entry_temp
    const tempResult = await pool.query(
        `SELECT bobbin_no, product_type, 
                mfd_1310_top, mfd_1310_bottom, 
                mfd_1550_top, mfd_1550_bottom,
                cut_off_top, cut_off_bottom, cable_cut_off
         FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (tempResult.rows.length === 0) {
        return {
            success: true,
            applicable: false,
            message: "Bobbin not found in qc_entry_temp."
        };
    }

    const record = tempResult.rows[0];
    const product_type = record.product_type || '';

    // Determine if this is a G657A1 or G657A2 product type
    const isG657A1 = product_type.startsWith(G657A1_PREFIX);
    const isG657A2 = product_type.startsWith(G657A2_PREFIX);

    if (!isG657A1 && !isG657A2) {
        return {
            success: true,
            applicable: false,
            message: "Product type does not require MFD/Cable Cutoff calculation."
        };
    }

    const updates = {};
    let mfd_calculated = false;
    let cable_cutoff_calculated = false;
    let cable_cutoff_mandatory_popup = false;

    // ═══════════════════════════════════════════════════════════
    // G657A1: MFD 1550 Calculation
    // ═══════════════════════════════════════════════════════════
    if (isG657A1) {
        const mfd_1550_top = parseFloatSafe(record.mfd_1550_top);
        const mfd_1550_bottom = parseFloatSafe(record.mfd_1550_bottom);
        const mfd_1310_top = parseFloatSafe(record.mfd_1310_top);
        const mfd_1310_bottom = parseFloatSafe(record.mfd_1310_bottom);

        // If both mfd_1550 values are already available → skip
        const topAvailable = mfd_1550_top !== null;
        const bottomAvailable = mfd_1550_bottom !== null;

        if (!topAvailable && mfd_1310_top !== null) {
            // Calculate mfd_1550_top = mfd_1310_top + 1.16
            const calculatedTop = parseFloat((mfd_1310_top + MFD_1550_OFFSET).toFixed(3));
            updates.mfd_1550_top = calculatedTop;
            mfd_calculated = true;
        }

        if (!bottomAvailable && mfd_1310_bottom !== null) {
            // Calculate mfd_1550_bottom = mfd_1310_bottom + 1.16
            const calculatedBottom = parseFloat((mfd_1310_bottom + MFD_1550_OFFSET).toFixed(3));
            updates.mfd_1550_bottom = calculatedBottom;
            mfd_calculated = true;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Cable Cutoff Calculation (both G657A1 and G657A2)
    // ═══════════════════════════════════════════════════════════
    const existingCableCutoff = parseFloatSafe(record.cable_cut_off);

    // Only calculate if cable_cut_off is not already set
    if (existingCableCutoff === null) {
        const cut_off_top = parseFloatSafe(record.cut_off_top);
        const cut_off_bottom = parseFloatSafe(record.cut_off_bottom);

        // Use whichever cut_off value is available (prefer top, fallback to bottom)
        const cutOffValue = cut_off_top !== null ? cut_off_top : cut_off_bottom;

        if (cutOffValue !== null) {
            const threshold = isG657A1 ? G657A1_CUTOFF_THRESHOLD : G657A2_CUTOFF_THRESHOLD;
            const offset = isG657A1 ? G657A1_CUTOFF_OFFSET : G657A2_CUTOFF_OFFSET;

            if (cutOffValue < threshold) {
                // Auto-calculate cable_cut_off
                const calculatedCableCutoff = parseFloat((cutOffValue - offset).toFixed(2));
                updates.cable_cut_off = calculatedCableCutoff;
                cable_cutoff_calculated = true;
            } else {
                // Cut-off is >= threshold → Cable Cutoff Mandatory popup
                cable_cutoff_mandatory_popup = true;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Apply updates to qc_entry_temp if any calculations were made
    // ═══════════════════════════════════════════════════════════
    const updateFields = Object.keys(updates);

    if (updateFields.length > 0) {
        const setClauses = updateFields.map((col, i) => `${col} = $${i + 1}`).join(', ');
        const values = updateFields.map(col => updates[col]);
        values.push(bobbin_no);

        await pool.query(
            `UPDATE qc_entry_temp SET ${setClauses} WHERE bobbin_no = $${values.length}`,
            values
        );
    }

    return {
        success: true,
        applicable: true,
        product_type,
        product_family: isG657A1 ? 'G657A1' : 'G657A2',
        mfd_calculated,
        cable_cutoff_calculated,
        cable_cutoff_mandatory_popup,
        updated_values: updates
    };
};

/**
 * Safely parse a float value, returning null if invalid/empty
 */
function parseFloatSafe(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
}
