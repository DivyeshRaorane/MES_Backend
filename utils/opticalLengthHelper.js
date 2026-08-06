/**
 * Optical Length Based Allocation Helper
 * 
 * Calculates the effective allocatable length from optical_length
 * based on the allocation_ratio defined in the spec.
 */

/**
 * Get the effective allocatable length based on optical length and ratio.
 * 
 * Rules:
 * - Full length cap: if optical_length >= 50.4, return 50.4
 * - Special rule for ratio 2.1: if 25.2 <= optical_length <= 27.3, return 25.2
 * - Special rule for ratio 4.2: if 25.2 <= optical_length <= 29.4, return 25.2
 * - Otherwise: return the nearest lower multiple of the ratio
 * 
 * @param {number} opticalLength - The optical_length from qc_entry
 * @param {number} ratio - The allocation_ratio from spec_master (2.1 or 4.2)
 * @returns {number|null} The effective length, or null if optical_length is below one unit of ratio
 */
export function getEffectiveLength(opticalLength, ratio) {
    if (opticalLength === null || opticalLength === undefined || isNaN(opticalLength)) {
        return null;
    }

    if (ratio === null || ratio === undefined || isNaN(ratio)) {
        return null;
    }

    const ol = parseFloat(opticalLength);
    const r = parseFloat(ratio);

    // Full length rule: if optical_length >= 50.4, return 50.4
    if (ol >= 50.4) {
        return 50.4;
    }

    // Special rule for ratio 2.1: if 25.2 <= optical_length <= 27.3, return 25.2
    if (r === 2.1 && ol >= 25.2 && ol <= 27.3) {
        return 25.2;
    }

    // Special rule for ratio 4.2: if 25.2 <= optical_length <= 29.4, return 25.2
    if (r === 4.2 && ol >= 25.2 && ol <= 29.4) {
        return 25.2;
    }

    // General rule: nearest lower multiple of ratio
    // Use Math.floor(ol / r) * r with rounding to avoid floating point issues
    const multiples = Math.floor(ol / r);

    if (multiples < 1) {
        return null; // Below one unit of ratio — not allocatable
    }

    // Round to 1 decimal place to avoid floating point artifacts
    const effectiveLength = Math.round(multiples * r * 10) / 10;

    return effectiveLength;
}
