import pool from "../../db/postgres.js";

// ─── 1. Available Functions (READ-ONLY discovery from pg_proc) ───────────────

export const getAvailableFunctionsS = async () => {
    const query = `
        SELECT
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_result(p.oid) AS return_type,
            pg_get_function_arguments(p.oid) AS arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND p.prokind = 'f'
          AND (
              pg_get_function_result(p.oid) = 'SETOF record'
              OR pg_get_function_result(p.oid) LIKE 'TABLE%'
              OR pg_get_function_result(p.oid) LIKE 'SETOF%'
          )
        ORDER BY n.nspname, p.proname;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// ─── 2. Function Parameters (READ-ONLY from information_schema) ──────────────

export const getFunctionParamsS = async (schemaName, functionName) => {
    const query = `
        SELECT
            p.parameter_name,
            p.data_type,
            p.parameter_default,
            p.ordinal_position,
            p.parameter_mode
        FROM information_schema.parameters p
        WHERE p.specific_schema = $1
          AND p.specific_name LIKE $2 || '_%'
          AND p.parameter_mode = 'IN'
        ORDER BY p.ordinal_position;
    `;
    const result = await pool.query(query, [schemaName, functionName]);
    return result.rows;
};

// ─── 3. Verify function exists in pg_proc ────────────────────────────────────

export const verifyFunctionExistsS = async (schemaName, functionName) => {
    const query = `
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = $1 AND p.proname = $2 AND p.prokind = 'f';
    `;
    const result = await pool.query(query, [schemaName, functionName]);
    return result.rows.length > 0;
};

// ─── Helper: normalize report row to include section_ids array ───────────────
// section column stores comma-separated values like "Draw,QC,Packing"
// section_ids is derived as an array for the frontend

const normalizeReportSections = (row) => {
    if (!row) return row;
    // Parse comma-separated section into section_ids array
    row.section_ids = row.section
        ? row.section.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    return row;
};

// ─── 4. Get All Reports (Admin) ─────────────────────────────────────────────

export const getAllReportsS = async () => {
    const query = `
        SELECT * FROM function_reports
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows.map(normalizeReportSections);
};

// ─── 5. Get Single Report by ID ─────────────────────────────────────────────

export const getReportByIdS = async (id) => {
    const query = `
        SELECT * FROM function_reports
        WHERE id = $1 AND deleted_at IS NULL;
    `;
    const result = await pool.query(query, [id]);
    return normalizeReportSections(result.rows[0] || null);
};

// ─── 6. Create Report Registration ──────────────────────────────────────────

export const createReportS = async (data) => {
    const { report_name, schema_name, function_name, section, section_ids, description, is_active, param_config, created_by } = data;

    // Check function exists
    const exists = await verifyFunctionExistsS(schema_name, function_name);
    if (!exists) {
        throw new Error(`Function "${schema_name}.${function_name}" does not exist in the database.`);
    }

    // Check unique report_name among non-deleted records
    const dupCheck = await pool.query(
        `SELECT id FROM function_reports WHERE report_name = $1 AND deleted_at IS NULL;`,
        [report_name]
    );
    if (dupCheck.rows.length > 0) {
        throw new Error(`A report with the name "${report_name}" already exists.`);
    }

    // Resolve section value: if frontend sends section_ids array, join as comma-separated
    // Otherwise use the section string as-is
    const resolvedSection = Array.isArray(section_ids) && section_ids.length > 0
        ? section_ids.join(',')
        : (section || null);

    const query = `
        INSERT INTO function_reports
            (report_name, schema_name, function_name, section, description, is_active, param_config, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    const values = [
        report_name,
        schema_name || 'public',
        function_name,
        resolvedSection,
        description || null,
        is_active !== undefined ? is_active : true,
        JSON.stringify(param_config || []),
        created_by || null
    ];
    const result = await pool.query(query, values);
    return normalizeReportSections(result.rows[0]);
};

// ─── 7. Update Report Registration ──────────────────────────────────────────

export const updateReportS = async (id, data) => {
    const { report_name, schema_name, function_name, section, section_ids, description, is_active, param_config } = data;

    // Verify the report exists
    const existing = await getReportByIdS(id);
    if (!existing) {
        throw new Error(`Report with id ${id} not found.`);
    }

    // If function_name changed, verify it exists
    const effectiveSchema = schema_name || existing.schema_name;
    const effectiveFunction = function_name || existing.function_name;

    if (function_name && (function_name !== existing.function_name || schema_name !== existing.schema_name)) {
        const exists = await verifyFunctionExistsS(effectiveSchema, effectiveFunction);
        if (!exists) {
            throw new Error(`Function "${effectiveSchema}.${effectiveFunction}" does not exist in the database.`);
        }
    }

    // Check unique report_name (excluding self)
    if (report_name && report_name !== existing.report_name) {
        const dupCheck = await pool.query(
            `SELECT id FROM function_reports WHERE report_name = $1 AND deleted_at IS NULL AND id != $2;`,
            [report_name, id]
        );
        if (dupCheck.rows.length > 0) {
            throw new Error(`A report with the name "${report_name}" already exists.`);
        }
    }

    // Resolve section: prefer section_ids array (join as comma-separated), then section string, then existing
    let resolvedSection;
    if (Array.isArray(section_ids) && section_ids.length > 0) {
        resolvedSection = section_ids.join(',');
    } else if (section !== undefined) {
        resolvedSection = section;
    } else {
        resolvedSection = existing.section;
    }

    const query = `
        UPDATE function_reports SET
            report_name = $1,
            schema_name = $2,
            function_name = $3,
            section = $4,
            description = $5,
            is_active = $6,
            param_config = $7,
            updated_at = NOW()
        WHERE id = $8 AND deleted_at IS NULL
        RETURNING *;
    `;
    const values = [
        report_name || existing.report_name,
        effectiveSchema,
        effectiveFunction,
        resolvedSection,
        description !== undefined ? description : existing.description,
        is_active !== undefined ? is_active : existing.is_active,
        JSON.stringify(param_config || existing.param_config),
        id
    ];
    const result = await pool.query(query, values);
    return normalizeReportSections(result.rows[0]);
};

// ─── 8. Toggle Status ────────────────────────────────────────────────────────

export const toggleReportStatusS = async (id) => {
    const query = `
        UPDATE function_reports
        SET is_active = NOT is_active, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
        throw new Error(`Report with id ${id} not found.`);
    }
    return result.rows[0];
};

// ─── 9. Soft Delete ──────────────────────────────────────────────────────────

export const deleteReportS = async (id) => {
    const query = `
        UPDATE function_reports
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
        throw new Error(`Report with id ${id} not found.`);
    }
    return result.rows[0];
};

// ─── 10. User Reports (filtered by section/permissions) ──────────────────────

export const getUserReportsS = async (user, sectionFilter) => {
    let query;
    let values = [];

    // Admin users see all active reports
    if (user.role === 'admin' || user.is_admin) {
        if (sectionFilter) {
            // Match if the comma-separated section column contains the filter value
            // Using: section LIKE '%Draw%' style, but safer with word boundary via regex or split
            query = `
                SELECT * FROM function_reports
                WHERE is_active = true AND deleted_at IS NULL
                  AND (',' || section || ',') LIKE '%,' || $1 || ',%'
                ORDER BY section, report_name;
            `;
            values = [sectionFilter];
        } else {
            query = `
                SELECT * FROM function_reports
                WHERE is_active = true AND deleted_at IS NULL
                ORDER BY section, report_name;
            `;
        }
    } else {
        // Non-admin: filter by user's department matching any value in the section column
        const userDepartments = user.departments || user.department
            ? (Array.isArray(user.departments) ? user.departments : [user.department])
            : [];

        if (sectionFilter) {
            if (userDepartments.length > 0) {
                // Must match sectionFilter AND user must have access
                // Build dynamic OR conditions for user department access
                const deptConditions = userDepartments.map((_, i) => `(',' || section || ',') LIKE '%,' || $${i + 2} || ',%'`).join(' OR ');
                query = `
                    SELECT * FROM function_reports
                    WHERE is_active = true AND deleted_at IS NULL
                      AND (',' || section || ',') LIKE '%,' || $1 || ',%'
                      AND (${deptConditions})
                    ORDER BY section, report_name;
                `;
                values = [sectionFilter, ...userDepartments];
            } else {
                query = `
                    SELECT * FROM function_reports
                    WHERE is_active = true AND deleted_at IS NULL
                      AND (',' || section || ',') LIKE '%,' || $1 || ',%'
                    ORDER BY section, report_name;
                `;
                values = [sectionFilter];
            }
        } else {
            if (userDepartments.length > 0) {
                // Match if any of user's departments appears in the section column
                const deptConditions = userDepartments.map((_, i) => `(',' || section || ',') LIKE '%,' || $${i + 1} || ',%'`).join(' OR ');
                query = `
                    SELECT * FROM function_reports
                    WHERE is_active = true AND deleted_at IS NULL
                      AND (${deptConditions})
                    ORDER BY section, report_name;
                `;
                values = [...userDepartments];
            } else {
                query = `
                    SELECT * FROM function_reports
                    WHERE is_active = true AND deleted_at IS NULL
                    ORDER BY section, report_name;
                `;
            }
        }
    }

    const result = await pool.query(query, values);
    return result.rows.map(normalizeReportSections);
};

// ─── 11. Execute Report Function ─────────────────────────────────────────────

export const executeReportS = async (id, params) => {
    // 1. Fetch report registration
    const report = await getReportByIdS(id);
    if (!report) {
        throw new Error(`Report with id ${id} not found.`);
    }
    if (!report.is_active) {
        throw new Error(`Report "${report.report_name}" is inactive.`);
    }

    // 2. Verify function still exists (safety check against injection)
    const exists = await verifyFunctionExistsS(report.schema_name, report.function_name);
    if (!exists) {
        throw new Error(`Function "${report.schema_name}.${report.function_name}" no longer exists in the database.`);
    }

    // 3. Build parameterized query
    const paramConfig = report.param_config || [];
    const paramValues = [];
    const paramPlaceholders = [];

    paramConfig.forEach((p, idx) => {
        const value = params[p.param_name];

        // Validate required params
        if (p.is_required && (value === null || value === undefined || value === '')) {
            throw new Error(`Parameter "${p.display_label}" is required.`);
        }

        paramValues.push(value !== undefined && value !== '' ? value : null);
        paramPlaceholders.push(`$${idx + 1}::${p.pg_type || 'text'}`);
    });

    // 4. Validate schema_name and function_name format (prevent injection)
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!identifierRegex.test(report.schema_name)) {
        throw new Error(`Invalid schema name: "${report.schema_name}".`);
    }
    if (!identifierRegex.test(report.function_name)) {
        throw new Error(`Invalid function name: "${report.function_name}".`);
    }

    // 5. Execute function using SELECT (NEVER CREATE/ALTER/DROP)
    const sql = `SELECT * FROM "${report.schema_name}"."${report.function_name}"(${paramPlaceholders.join(', ')})`;

    const startTime = Date.now();
    const result = await pool.query(sql, paramValues);
    const executionTime = Date.now() - startTime;

    return {
        data: result.rows,
        totalRows: result.rowCount,
        columns: result.fields.map(f => ({ field: f.name, header: f.name.replace(/_/g, ' ') })),
        executionTime
    };
};

// ─── 12. Get Sections ────────────────────────────────────────────────────────

export const getSectionsS = async () => {
    // Split comma-separated section values and return distinct list
    const query = `
        SELECT DISTINCT trim(unnest(string_to_array(section, ','))) AS section
        FROM function_reports
        WHERE deleted_at IS NULL AND section IS NOT NULL AND section != ''
        ORDER BY section;
    `;
    const result = await pool.query(query);
    return result.rows.map(r => r.section);
};
