import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════
// HELPER: Resolve section_keys (strings) to section_ids (integers)
// Accepts a mix of integer IDs and string keys, returns all as integers.
// ═══════════════════════════════════════════════════════════════

async function resolveSectionIds(client, sectionIds) {
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) return [];

    // Separate integers from strings
    const integerIds = [];
    const stringKeys = [];

    for (const id of sectionIds) {
        if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
            integerIds.push(Number(id));
        } else if (typeof id === 'string' && id.trim()) {
            stringKeys.push(id.trim());
        }
    }

    // Look up string keys in report_section_master
    if (stringKeys.length > 0) {
        const result = await client.query(
            `SELECT section_id FROM report_section_master WHERE section_key = ANY($1)`,
            [stringKeys]
        );
        for (const row of result.rows) {
            integerIds.push(row.section_id);
        }
    }

    return integerIds;
}

// ═══════════════════════════════════════════════════════════════
// REPORT SECTION SERVICES
// ═══════════════════════════════════════════════════════════════

/**
 * Get all active sections (for admin UI multi-select dropdown)
 */
export const getAllSectionsS = async () => {
    const result = await pool.query(
        `SELECT section_id, section_key, section_name, display_order 
         FROM report_section_master 
         WHERE disable = FALSE 
         ORDER BY display_order ASC`
    );
    return result.rows;
};

/**
 * Get sections mapped to a specific report
 */
export const getReportSectionsS = async (reportId) => {
    const result = await pool.query(
        `SELECT rsm.section_id, rsm.section_key, rsm.section_name
         FROM report_section_mapping m
         JOIN report_section_master rsm ON rsm.section_id = m.section_id
         WHERE m.report_id = $1
         ORDER BY rsm.display_order ASC`,
        [reportId]
    );
    return result.rows;
};

/**
 * Update section mappings for a report (replace all)
 * Accepts both integer section_ids and string section_keys.
 */
export const updateReportSectionsS = async (reportId, sectionIds) => {
    const client = await pool.connect();
    try {
        // Validate: at least one section required
        if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
            throw new Error('At least one section must be selected');
        }

        // Validate: report exists
        const reportCheck = await client.query(
            'SELECT id FROM report_master WHERE id = $1 AND is_deleted = FALSE',
            [reportId]
        );
        if (reportCheck.rows.length === 0) {
            throw new Error('Report not found');
        }

        // Resolve string section_keys to integer section_ids
        const resolvedIds = await resolveSectionIds(client, sectionIds);

        if (resolvedIds.length === 0) {
            throw new Error('No valid sections found');
        }

        await client.query('BEGIN');

        // Delete existing mappings for this report
        await client.query(
            'DELETE FROM report_section_mapping WHERE report_id = $1',
            [reportId]
        );

        // Insert new mappings
        if (resolvedIds.length > 0) {
            const values = resolvedIds.map((sid, i) =>
                `($1, $${i + 2})`
            ).join(', ');
            await client.query(
                `INSERT INTO report_section_mapping (report_id, section_id) VALUES ${values}`,
                [reportId, ...resolvedIds]
            );
        }

        await client.query('COMMIT');

        // Return updated mappings
        const updated = await pool.query(
            `SELECT rsm.section_id, rsm.section_key, rsm.section_name
             FROM report_section_mapping m
             JOIN report_section_master rsm ON rsm.section_id = m.section_id
             WHERE m.report_id = $1
             ORDER BY rsm.display_order ASC`,
            [reportId]
        );

        return updated.rows;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Save section mappings for a newly created report.
 * If no section_ids provided, defaults to DYNAMIC_REPORTS.
 * Accepts both integer section_ids and string section_keys.
 * Uses an existing client (for transaction support).
 */
export const saveSectionMappingsS = async (client, reportId, sectionIds) => {
    let sectionsToMap = sectionIds;

    if (!Array.isArray(sectionsToMap) || sectionsToMap.length === 0) {
        // Default: map to DYNAMIC_REPORTS section
        const defaultSection = await client.query(
            `SELECT section_id FROM report_section_master WHERE section_key = 'DYNAMIC_REPORTS'`
        );
        if (defaultSection.rows.length > 0) {
            sectionsToMap = [defaultSection.rows[0].section_id];
        } else {
            return [];
        }
    }

    // Resolve string section_keys to integer section_ids
    const resolvedIds = await resolveSectionIds(client, sectionsToMap);

    if (resolvedIds.length > 0) {
        const values = resolvedIds.map((sid, i) =>
            `($1, $${i + 2})`
        ).join(', ');
        await client.query(
            `INSERT INTO report_section_mapping (report_id, section_id) VALUES ${values}
             ON CONFLICT (report_id, section_id) DO NOTHING`,
            [reportId, ...resolvedIds]
        );
    }

    return resolvedIds;
};

/**
 * Update section mappings within an existing transaction.
 * Accepts both integer section_ids and string section_keys.
 * Uses an existing client (for transaction support).
 */
export const updateSectionMappingsInTxS = async (client, reportId, sectionIds) => {
    if (!Array.isArray(sectionIds)) return;

    if (sectionIds.length === 0) {
        throw new Error('At least one section must be selected');
    }

    // Resolve string section_keys to integer section_ids
    const resolvedIds = await resolveSectionIds(client, sectionIds);

    if (resolvedIds.length === 0) {
        throw new Error('No valid sections found');
    }

    // Delete existing mappings
    await client.query(
        'DELETE FROM report_section_mapping WHERE report_id = $1',
        [reportId]
    );

    // Insert new mappings
    const values = resolvedIds.map((sid, i) =>
        `($1, $${i + 2})`
    ).join(', ');
    await client.query(
        `INSERT INTO report_section_mapping (report_id, section_id) VALUES ${values}
         ON CONFLICT (report_id, section_id) DO NOTHING`,
        [reportId, ...resolvedIds]
    );
};

/**
 * Duplicate section mappings from one report to another.
 * Uses an existing client (for transaction support).
 */
export const duplicateSectionMappingsS = async (client, sourceReportId, newReportId) => {
    await client.query(
        `INSERT INTO report_section_mapping (report_id, section_id)
         SELECT $1, section_id FROM report_section_mapping WHERE report_id = $2
         ON CONFLICT (report_id, section_id) DO NOTHING`,
        [newReportId, sourceReportId]
    );
};

/**
 * Get section mappings for multiple reports at once (batch).
 * Returns a map: { reportId: [{ section_id, section_key, section_name }] }
 */
export const getSectionMappingsBatchS = async (reportIds) => {
    if (!reportIds || reportIds.length === 0) return {};

    const result = await pool.query(
        `SELECT m.report_id, rsm.section_id, rsm.section_key, rsm.section_name
         FROM report_section_mapping m
         JOIN report_section_master rsm ON rsm.section_id = m.section_id
         WHERE m.report_id = ANY($1)
         ORDER BY rsm.display_order ASC`,
        [reportIds]
    );

    const sectionMap = {};
    result.rows.forEach(row => {
        if (!sectionMap[row.report_id]) sectionMap[row.report_id] = [];
        sectionMap[row.report_id].push({
            section_id: row.section_id,
            section_key: row.section_key,
            section_name: row.section_name
        });
    });

    return sectionMap;
};
