import pool from "../../db/postgres.js";

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

        // Validate: all section_ids exist and are active
        const sectionCheck = await client.query(
            `SELECT section_id FROM report_section_master 
             WHERE section_id = ANY($1) AND disable = FALSE`,
            [sectionIds]
        );
        if (sectionCheck.rows.length !== sectionIds.length) {
            throw new Error('One or more invalid section IDs');
        }

        await client.query('BEGIN');

        // Delete existing mappings for this report
        await client.query(
            'DELETE FROM report_section_mapping WHERE report_id = $1',
            [reportId]
        );

        // Insert new mappings
        if (sectionIds.length > 0) {
            const values = sectionIds.map((sid, i) =>
                `($1, $${i + 2})`
            ).join(', ');
            await client.query(
                `INSERT INTO report_section_mapping (report_id, section_id) VALUES ${values}`,
                [reportId, ...sectionIds]
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

    if (sectionsToMap.length > 0) {
        const values = sectionsToMap.map((sid, i) =>
            `($1, $${i + 2})`
        ).join(', ');
        await client.query(
            `INSERT INTO report_section_mapping (report_id, section_id) VALUES ${values}
             ON CONFLICT (report_id, section_id) DO NOTHING`,
            [reportId, ...sectionsToMap]
        );
    }

    return sectionsToMap;
};

/**
 * Update section mappings within an existing transaction.
 * Uses an existing client (for transaction support).
 */
export const updateSectionMappingsInTxS = async (client, reportId, sectionIds) => {
    if (!Array.isArray(sectionIds)) return;

    if (sectionIds.length === 0) {
        throw new Error('At least one section must be selected');
    }

    // Delete existing mappings
    await client.query(
        'DELETE FROM report_section_mapping WHERE report_id = $1',
        [reportId]
    );

    // Insert new mappings
    const values = sectionIds.map((sid, i) =>
        `($1, $${i + 2})`
    ).join(', ');
    await client.query(
        `INSERT INTO report_section_mapping (report_id, section_id) VALUES ${values}
         ON CONFLICT (report_id, section_id) DO NOTHING`,
        [reportId, ...sectionIds]
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
