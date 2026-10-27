import pool from "../../db/postgres.js";

// ─── Shared constants & helpers (multi-function reports) ─────────────────────

/** Error with an HTTP status so controllers don't have to match on message text. */
export class ReportError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "ReportError";
        this.statusCode = statusCode;
    }
}

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
// Words/spaces only, optional (n[,m]) and optional []. Rejects quotes, ;, --, etc.
const PG_TYPE_REGEX = /^[a-zA-Z_][a-zA-Z0-9_ ]*(\(\s*\d+\s*(,\s*\d+\s*)?\))?(\[\])?$/;
const BLOCKED_SCHEMAS = ["pg_catalog", "information_schema"];

const REPORT_TYPE_ALIASES = {
    single: "single",
    multitable: "multi_table",
    multisheet: "multi_sheet"
};

/** Accepts single | multi_table | multi_sheet (also "multitable", "multi-sheet", ...). */
export const normalizeReportType = (value) => {
    if (value === undefined || value === null || value === "") return "single";
    const key = String(value).toLowerCase().replace(/[^a-z]/g, "");
    const type = REPORT_TYPE_ALIASES[key];
    if (!type) {
        throw new ReportError(`Invalid report_type "${value}". Use single, multi_table or multi_sheet.`);
    }
    return type;
};

/** "fn_a, fn_b" or ["fn_a","fn_b"] -> ["fn_a","fn_b"] */
export const parseFunctionNames = (value) => {
    const list = Array.isArray(value) ? value : String(value ?? "").split(",");
    return list.map((s) => String(s).trim()).filter(Boolean);
};

const parseParamConfig = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const safePgType = (pgType) => {
    const type = pgType || "text";
    if (!PG_TYPE_REGEX.test(type)) {
        throw new ReportError(`Invalid parameter type: "${pgType}".`);
    }
    return type;
};

const validateParamConfig = (paramConfig) => {
    if (!Array.isArray(paramConfig)) {
        throw new ReportError("param_config must be an array.");
    }
    const seen = new Set();
    for (const p of paramConfig) {
        if (!p || !IDENTIFIER_REGEX.test(String(p.param_name ?? ""))) {
            throw new ReportError(`Invalid parameter name: "${p?.param_name}".`);
        }
        if (seen.has(p.param_name)) {
            throw new ReportError(`Duplicate parameter "${p.param_name}" in param_config.`);
        }
        seen.add(p.param_name);
        safePgType(p.pg_type);
    }
};

/** Pure checks on the chosen type + function list (no DB access). */
const validateFunctionSelection = (type, schemaName, functionNames) => {
    if (!IDENTIFIER_REGEX.test(schemaName)) {
        throw new ReportError(`Invalid schema name: "${schemaName}".`);
    }
    if (BLOCKED_SCHEMAS.includes(schemaName.toLowerCase())) {
        throw new ReportError(`Schema "${schemaName}" cannot be used for reports.`);
    }
    if (functionNames.length === 0) {
        throw new ReportError("At least one function is required.");
    }
    for (const fn of functionNames) {
        if (!IDENTIFIER_REGEX.test(fn)) {
            throw new ReportError(`Invalid function name: "${fn}".`);
        }
    }
    if (new Set(functionNames).size !== functionNames.length) {
        throw new ReportError("The same function cannot be added twice to a report.");
    }
    if (type === "single" && functionNames.length > 1) {
        throw new ReportError("A single report can use only one function. Choose multi_table or multi_sheet.");
    }
    if (type !== "single" && functionNames.length < 2) {
        throw new ReportError("Multi-table and multi-sheet reports need at least two functions.");
    }
};

// ─── IN-parameter signatures (one query for a whole schema) ──────────────────
// Returns Map<function_name, Array<{ params: [{ name, type }] }>> (array = overloads)

const loadSignatures = async (schemaName) => {
    const query = `
        SELECT r.specific_name,
               r.routine_name,
               p.parameter_name,
               p.udt_name,
               p.ordinal_position
        FROM information_schema.routines r
        LEFT JOIN information_schema.parameters p
               ON p.specific_schema = r.specific_schema
              AND p.specific_name   = r.specific_name
              AND p.parameter_mode  = 'IN'
        WHERE r.specific_schema = $1
          AND r.routine_type = 'FUNCTION'
        ORDER BY r.specific_name, p.ordinal_position;
    `;
    const result = await pool.query(query, [schemaName]);

    const bySpecific = new Map();
    for (const row of result.rows) {
        if (!bySpecific.has(row.specific_name)) {
            bySpecific.set(row.specific_name, { function_name: row.routine_name, params: [] });
        }
        if (row.udt_name) {
            bySpecific.get(row.specific_name).params.push({ name: row.parameter_name, type: row.udt_name });
        }
    }

    const byFunction = new Map();
    for (const entry of bySpecific.values()) {
        if (!byFunction.has(entry.function_name)) byFunction.set(entry.function_name, []);
        byFunction.get(entry.function_name).push(entry);
    }
    return byFunction;
};

const signatureKey = (params) => params.map((p) => `${p.name}:${p.type}`).sort().join("|");
const describeParams = (params) => params.map((p) => `${p.name} ${p.type}`).join(", ") || "(no parameters)";

/** Returns the single (non-overloaded, fully named) signature of a function or throws. */
const resolveSignature = (signatures, schemaName, functionName) => {
    const overloads = signatures.get(functionName);
    if (!overloads) {
        throw new ReportError(`Function "${schemaName}.${functionName}" does not exist in the database.`);
    }
    if (overloads.length > 1) {
        throw new ReportError(`Function "${schemaName}.${functionName}" is overloaded and cannot be used in a multi-function report.`);
    }
    const { params } = overloads[0];
    if (params.some((p) => !p.name)) {
        throw new ReportError(`Function "${schemaName}.${functionName}" has unnamed parameters and cannot be used in a multi-function report.`);
    }
    return params;
};

// ─── 1. Available Functions (READ-ONLY discovery from pg_proc) ───────────────

// export const getAvailableFunctionsS = async () => {
//     const query = `
//         SELECT
//             n.nspname AS schema_name,
//             p.proname AS function_name,
//             pg_get_function_result(p.oid) AS return_type,
//             pg_get_function_arguments(p.oid) AS arguments
//         FROM pg_proc p
//         JOIN pg_namespace n ON p.pronamespace = n.oid
//         WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
//           AND p.prokind = 'f'
//           AND (
//               pg_get_function_result(p.oid) = 'SETOF record'
//               OR pg_get_function_result(p.oid) LIKE 'TABLE%'
//               OR pg_get_function_result(p.oid) LIKE 'SETOF%'
//           )
//         ORDER BY n.nspname, p.proname;
//     `;
//     const result = await pool.query(query);
//     return result.rows;
// };


export const getAvailableFunctionsS = async () => {
    const query = `
        SELECT
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_result(p.oid) AS return_type,
            pg_get_function_arguments(p.oid) AS arguments
        FROM pg_proc p
        JOIN pg_namespace n
            ON p.pronamespace = n.oid
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND p.prokind = 'f'
        ORDER BY n.nspname, p.proname;
    `;

    const result = await pool.query(query);

    return result.rows;
};

// ─── 2. Function Parameters (READ-ONLY from information_schema) ──────────────

export const getFunctionParamsS = async (schemaName, functionName) => {
    const query = `
        SELECT DISTINCT ON (p.parameter_name)
            p.parameter_name,
            p.data_type,
            p.parameter_default,
            p.ordinal_position,
            p.parameter_mode
        FROM information_schema.parameters p
        JOIN pg_proc pr ON pr.proname = $2
        JOIN pg_namespace ns ON ns.oid = pr.pronamespace AND ns.nspname = $1
        WHERE p.specific_schema = $1
          AND p.specific_name = $2 || '_' || pr.oid::text
          AND p.parameter_mode = 'IN'
        ORDER BY p.parameter_name, p.ordinal_position;
    `;
    const result = await pool.query(query, [schemaName, functionName]);

    // Re-sort by ordinal_position after DISTINCT ON
    result.rows.sort((a, b) => a.ordinal_position - b.ordinal_position);
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

// ─── 3b. Verify the whole function selection for a report ────────────────────
// - every function must exist in the schema
// - multi types: every function must take exactly the same IN parameters
//   (names + types, order does not matter) and every param_config entry must
//   be one of those parameters

const verifyFunctionsForType = async (schemaName, type, functionNames, paramConfig) => {
    for (const fn of functionNames) {
        const exists = await verifyFunctionExistsS(schemaName, fn);
        if (!exists) {
            throw new ReportError(`Function "${schemaName}.${fn}" does not exist in the database.`);
        }
    }

    if (type === "single") return;

    const signatures = await loadSignatures(schemaName);
    const baseName = functionNames[0];
    const baseParams = resolveSignature(signatures, schemaName, baseName);
    const baseKey = signatureKey(baseParams);

    for (const fn of functionNames.slice(1)) {
        const params = resolveSignature(signatures, schemaName, fn);
        if (signatureKey(params) !== baseKey) {
            throw new ReportError(
                `All functions in a multi report must have the same parameters. ` +
                `"${fn}" takes (${describeParams(params)}) but "${baseName}" takes (${describeParams(baseParams)}).`
            );
        }
    }

    const allowed = new Set(baseParams.map((p) => p.name));
    for (const p of paramConfig) {
        if (!allowed.has(p.param_name)) {
            throw new ReportError(`Parameter "${p.param_name}" is not a parameter of the selected functions.`);
        }
    }
};

// ─── 3c. Functions that can be combined with a chosen function ───────────────
// Same IN parameters (names + types). Used to filter the UI dropdown.

export const getCompatibleFunctionsS = async (schemaName, functionName) => {
    if (!IDENTIFIER_REGEX.test(schemaName || "") || !IDENTIFIER_REGEX.test(functionName || "")) {
        throw new ReportError("Valid schema_name and function_name are required.");
    }
    if (BLOCKED_SCHEMAS.includes(schemaName.toLowerCase())) {
        throw new ReportError(`Schema "${schemaName}" cannot be used for reports.`);
    }

    const signatures = await loadSignatures(schemaName);
    if (!signatures.has(functionName)) {
        throw new ReportError(`Function "${schemaName}.${functionName}" does not exist in the database.`, 404);
    }
    const baseParams = resolveSignature(signatures, schemaName, functionName);
    const baseKey = signatureKey(baseParams);

    const compatible = [];
    for (const [name, overloads] of signatures) {
        if (name === functionName || overloads.length !== 1) continue;
        const { params } = overloads[0];
        if (params.some((p) => !p.name)) continue;
        if (signatureKey(params) === baseKey) {
            compatible.push({
                schema_name: schemaName,
                function_name: name,
                arguments: describeParams(params)
            });
        }
    }
    compatible.sort((a, b) => a.function_name.localeCompare(b.function_name));
    return compatible;
};

// ─── Helper: normalize report row to include section_ids array ───────────────
// section column stores comma-separated values like "Draw,QC,Packing"
// section_ids is derived as an array for the frontend
// function_name stores a comma-separated, ordered list for multi reports;
// function_names is derived as an array and report_type defaults to "single"

const normalizeReportSections = (row) => {
    if (!row) return row;
    row.report_type = row.report_type || "single";
    row.function_names = parseFunctionNames(row.function_name);
    row.param_config = parseParamConfig(row.param_config);
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
    const { report_name, schema_name, function_name, report_type, section, section_ids, description, is_active, param_config, created_by } = data;

    if (!report_name || !String(report_name).trim()) {
        throw new ReportError("report_name is required.");
    }

    const effectiveSchema = schema_name || 'public';
    const type = normalizeReportType(report_type);
    const functionNames = parseFunctionNames(function_name);
    const paramConfig = param_config === undefined || param_config === null ? [] : param_config;

    // Pure validation first, then DB checks (function exists, same params for multi types)
    validateFunctionSelection(type, effectiveSchema, functionNames);
    validateParamConfig(paramConfig);
    await verifyFunctionsForType(effectiveSchema, type, functionNames, paramConfig);

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
            (report_name, schema_name, function_name, report_type, section, description, is_active, param_config, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
    `;
    const values = [
        report_name,
        effectiveSchema,
        functionNames.join(','),
        type,
        resolvedSection,
        description || null,
        is_active !== undefined ? is_active : true,
        JSON.stringify(paramConfig),
        created_by || null
    ];
    const result = await pool.query(query, values);
    return normalizeReportSections(result.rows[0]);
};

// ─── 7. Update Report Registration ──────────────────────────────────────────

export const updateReportS = async (id, data) => {
    const { report_name, schema_name, function_name, report_type, section, section_ids, description, is_active, param_config } = data;

    // Verify the report exists
    const existing = await getReportByIdS(id);
    if (!existing) {
        throw new ReportError(`Report with id ${id} not found.`, 404);
    }

    // Effective values = request value, else what is already stored
    const effectiveSchema = schema_name || existing.schema_name;
    const effectiveType = report_type !== undefined && report_type !== null && report_type !== ""
        ? normalizeReportType(report_type)
        : (existing.report_type || 'single');
    const effectiveNames = function_name !== undefined && function_name !== null && function_name !== ""
        ? parseFunctionNames(function_name)
        : existing.function_names;
    const effectiveConfig = param_config !== undefined && param_config !== null
        ? param_config
        : existing.param_config;

    // Always check the selection rules (cheap, no DB). Only hit the DB when
    // something relevant changed, so editing e.g. a description still works
    // even if a function was dropped meanwhile.
    validateFunctionSelection(effectiveType, effectiveSchema, effectiveNames);

    const functionsChanged =
        effectiveSchema !== existing.schema_name ||
        effectiveType !== existing.report_type ||
        effectiveNames.join(',') !== existing.function_name;
    const configChanged = JSON.stringify(effectiveConfig) !== JSON.stringify(existing.param_config);

    if (configChanged) {
        validateParamConfig(effectiveConfig);
    }
    if (functionsChanged || (configChanged && effectiveType !== 'single')) {
        await verifyFunctionsForType(effectiveSchema, effectiveType, effectiveNames, effectiveConfig);
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
            report_type = $4,
            section = $5,
            description = $6,
            is_active = $7,
            param_config = $8,
            updated_at = NOW()
        WHERE id = $9 AND deleted_at IS NULL
        RETURNING *;
    `;
    const values = [
        report_name || existing.report_name,
        effectiveSchema,
        effectiveNames.join(','),
        effectiveType,
        resolvedSection,
        description !== undefined ? description : existing.description,
        is_active !== undefined ? is_active : existing.is_active,
        JSON.stringify(effectiveConfig),
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

const isEmptyParam = (value) => value === null || value === undefined || value === '';

/** Runs one SELECT and returns { data, totalRows, columns, executionTime } (JSON columns expanded). */
const runFunctionQuery = async (sql, values) => {
    const startTime = Date.now();
    const result = await pool.query(sql, values);
    const executionTime = Date.now() - startTime;

    const rawColumns = result.fields.map(f => ({ field: f.name, header: f.name.replace(/_/g, ' ') }));

    // Expand JSON/JSONB object columns into separate flat columns
    const { columns, data } = expandJsonColumns(result.rows, rawColumns);

    return { data, totalRows: result.rowCount, columns, executionTime };
};

/** "fn_draw_spool_pt_summary" -> "Draw Spool Pt Summary" */
const humanizeFunctionName = (functionName) =>
    functionName
        .replace(/^fn_/i, '')
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || functionName;

/** Excel-safe, unique (case-insensitive) sheet name: max 31 chars, none of [ ] : * ? / \ */
const buildSheetName = (title, index, used) => {
    const base = (title.replace(/[\[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim() || `Sheet ${index + 1}`).slice(0, 31);
    let name = base;
    let n = 2;
    while (used.has(name.toLowerCase())) {
        const suffix = `_${n++}`;
        name = base.slice(0, 31 - suffix.length) + suffix;
    }
    used.add(name.toLowerCase());
    return name;
};

export const executeReportS = async (id, params = {}) => {
    // 1. Fetch report registration
    const report = await getReportByIdS(id);
    if (!report) {
        throw new ReportError(`Report with id ${id} not found.`, 404);
    }
    if (!report.is_active) {
        throw new ReportError(`Report "${report.report_name}" is inactive.`);
    }

    const type = report.report_type || 'single';
    const functionNames = report.function_names;
    const paramConfig = report.param_config;

    // 2. Validate identifiers (prevent injection) and that every function still exists
    if (!IDENTIFIER_REGEX.test(report.schema_name)) {
        throw new ReportError(`Invalid schema name: "${report.schema_name}".`);
    }
    if (functionNames.length === 0) {
        throw new ReportError(`Report "${report.report_name}" has no function configured.`);
    }
    for (const fn of functionNames) {
        if (!IDENTIFIER_REGEX.test(fn)) {
            throw new ReportError(`Invalid function name: "${fn}".`);
        }
        const exists = await verifyFunctionExistsS(report.schema_name, fn);
        if (!exists) {
            throw new ReportError(`Function "${report.schema_name}.${fn}" no longer exists in the database.`);
        }
    }

    // ── SINGLE: unchanged behaviour (positional parameters, flat response) ──
    if (type === 'single') {
        const paramValues = [];
        const paramPlaceholders = [];

        paramConfig.forEach((p, idx) => {
            const value = params[p.param_name];

            // Validate required params
            if (p.is_required && isEmptyParam(value)) {
                throw new ReportError(`Parameter "${p.display_label}" is required.`);
            }

            paramValues.push(!isEmptyParam(value) ? value : null);
            paramPlaceholders.push(`$${idx + 1}::${safePgType(p.pg_type)}`);
        });

        // SELECT only (NEVER CREATE/ALTER/DROP)
        const sql = `SELECT * FROM "${report.schema_name}"."${functionNames[0]}"(${paramPlaceholders.join(', ')})`;
        const result = await runFunctionQuery(sql, paramValues);
        return { report_type: 'single', ...result };
    }

    // ── MULTI (multi_table / multi_sheet): all functions get the SAME params ──
    // Named notation (p_start_date => $1) so the argument order of each function
    // does not matter and omitted optional params fall back to the function DEFAULT.
    const namedArgs = [];
    const namedValues = [];
    for (const p of paramConfig) {
        const value = params[p.param_name];
        if (p.is_required && isEmptyParam(value)) {
            throw new ReportError(`Parameter "${p.display_label || p.param_name}" is required.`);
        }
        if (isEmptyParam(value)) continue;
        if (!IDENTIFIER_REGEX.test(p.param_name)) {
            throw new ReportError(`Invalid parameter name: "${p.param_name}".`);
        }
        namedValues.push(value);
        namedArgs.push(`"${p.param_name}" => $${namedValues.length}::${safePgType(p.pg_type)}`);
    }
    const argSql = namedArgs.join(', ');

    const usedSheetNames = new Set();
    const items = [];
    let totalRows = 0;
    let executionTime = 0;

    // Sequential: the stored order is the display / sheet order.
    for (let i = 0; i < functionNames.length; i++) {
        const fn = functionNames[i];
        const title = humanizeFunctionName(fn);
        const meta = {
            sequence: i + 1,
            function_name: fn,
            title,
            sheet_name: buildSheetName(title, i, usedSheetNames)
        };

        try {
            const sql = `SELECT * FROM "${report.schema_name}"."${fn}"(${argSql})`;
            const result = await runFunctionQuery(sql, namedValues);
            totalRows += result.totalRows;
            executionTime += result.executionTime;
            items.push({ ...meta, success: true, error: null, ...result });
        } catch (error) {
            // One failing function must not hide the others
            items.push({ ...meta, success: false, error: error.message, data: [], columns: [], totalRows: 0, executionTime: 0 });
        }
    }

    return { report_type: type, items, totalRows, executionTime };
};

// ─── JSON/JSONB Column Expansion Helper ──────────────────────────────────────
// Detects columns whose values are plain objects (not arrays, not null) across
// all rows, then expands each JSON key into its own column. Month-style keys
// (e.g. "Jul-26", "Apr-26") are sorted chronologically descending.

const MONTH_MAP = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Check if a key looks like a month-year pattern (e.g. "Jul-26", "Apr-2026")
 */
const isMonthKey = (key) => {
    const match = key.match(/^([A-Za-z]{3})-(\d{2,4})$/);
    if (!match) return false;
    const mon = match[1].toLowerCase();
    return mon in MONTH_MAP;
};

/**
 * Parse a month key into a sortable numeric value (year * 12 + month)
 */
const parseMonthKey = (key) => {
    const match = key.match(/^([A-Za-z]{3})-(\d{2,4})$/);
    if (!match) return 0;
    const mon = MONTH_MAP[match[1].toLowerCase()] || 0;
    let year = parseInt(match[2], 10);
    if (year < 100) year += 2000; // "26" -> 2026
    return year * 12 + mon;
};

/**
 * Expand JSON/JSONB object fields in result rows into flat scalar columns.
 * Normal (non-object) columns pass through unchanged.
 */
const expandJsonColumns = (rows, originalColumns) => {
    if (!rows || rows.length === 0) {
        return { columns: originalColumns, data: rows };
    }

    // Detect which columns contain expandable JSON objects
    // A column is expandable if at least one row has a non-null plain object (not array) value
    const jsonFieldNames = new Set();
    for (const row of rows) {
        for (const col of originalColumns) {
            const val = row[col.field];
            if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                jsonFieldNames.add(col.field);
            }
        }
    }

    // If no JSON columns detected, return as-is (backward compatible)
    if (jsonFieldNames.size === 0) {
        return { columns: originalColumns, data: rows };
    }

    // Collect all unique JSON keys per expandable field across all rows
    const jsonFieldKeys = {}; // { fieldName: Set of keys }
    for (const fieldName of jsonFieldNames) {
        jsonFieldKeys[fieldName] = new Set();
    }
    for (const row of rows) {
        for (const fieldName of jsonFieldNames) {
            const val = row[fieldName];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                Object.keys(val).forEach(k => jsonFieldKeys[fieldName].add(k));
            }
        }
    }

    // Build expanded column list
    const expandedColumns = [];
    for (const col of originalColumns) {
        if (jsonFieldNames.has(col.field)) {
            // Replace this column with its expanded JSON keys
            let keys = Array.from(jsonFieldKeys[col.field]);

            // Sort: if all keys are month-style, sort chronologically descending
            const allMonths = keys.length > 0 && keys.every(isMonthKey);
            if (allMonths) {
                keys.sort((a, b) => parseMonthKey(b) - parseMonthKey(a)); // descending
            }
            // Otherwise, keep insertion/discovery order (first-seen from rows)

            for (const key of keys) {
                expandedColumns.push({
                    field: key,
                    header: key,
                    isExpanded: true,
                    sourceField: col.field
                });
            }
        } else {
            expandedColumns.push(col);
        }
    }

    // Flatten rows: expand JSON fields into top-level scalar properties
    const expandedData = rows.map(row => {
        const flatRow = {};
        for (const col of originalColumns) {
            if (jsonFieldNames.has(col.field)) {
                // Expand the JSON object keys into the flat row
                const obj = row[col.field];
                const keys = jsonFieldKeys[col.field];
                for (const key of keys) {
                    flatRow[key] = (obj && typeof obj === 'object') ? (obj[key] ?? null) : null;
                }
            } else {
                flatRow[col.field] = row[col.field];
            }
        }
        return flatRow;
    });

    return { columns: expandedColumns, data: expandedData };
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
