import pool from "../../db/postgres.js";
import { QueryBuilder } from "./queryBuilder.js";

// ═══════════════════════════════════════════════════════════════
// DATABASE DISCOVERY
// ═══════════════════════════════════════════════════════════════

const EXCLUDED_TABLES = [
    'report_master', 'report_permissions', 'report_execution_log',
    'report_saved_filters', 'report_version_history'
];

export const getTablesS = async () => {
    const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name != ALL($1)
        ORDER BY table_name
    `, [EXCLUDED_TABLES]);

    return result.rows;
};

export const getTableColumnsS = async (tableName) => {
    // Validate table exists
    const tableCheck = await pool.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
        [tableName]
    );
    if (tableCheck.rows.length === 0) {
        throw new Error('Table not found');
    }

    const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
    `, [tableName]);

    return result.rows;
};

export const getTableRelationshipsS = async (tableName) => {
    const result = await pool.query(`
        SELECT
            kcu.column_name AS from_column,
            ccu.table_name AS to_table,
            ccu.column_name AS to_column,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
    `, [tableName]);

    // Also get reverse relationships (tables that reference this table)
    const reverseResult = await pool.query(`
        SELECT
            kcu.table_name AS from_table,
            kcu.column_name AS from_column,
            ccu.column_name AS to_column,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name = $1
    `, [tableName]);

    return {
        outgoing: result.rows,
        incoming: reverseResult.rows
    };
};

// ═══════════════════════════════════════════════════════════════
// REPORT CRUD
// ═══════════════════════════════════════════════════════════════

export const getAllReportsS = async () => {
    const result = await pool.query(`
        SELECT rm.*, u.emp_name as created_by_name
        FROM report_master rm
        LEFT JOIN users u ON rm.created_by = u.id
        WHERE rm.is_deleted = FALSE
        ORDER BY rm.created_at DESC
    `);
    return result.rows;
};

export const getReportByIdS = async (id) => {
    const result = await pool.query(`
        SELECT rm.*, u.emp_name as created_by_name
        FROM report_master rm
        LEFT JOIN users u ON rm.created_by = u.id
        WHERE rm.id = $1 AND rm.is_deleted = FALSE
    `, [id]);

    if (result.rows.length === 0) {
        throw new Error('Report not found');
    }

    const report = result.rows[0];

    // Fetch permissions for this report
    const permResult = await pool.query(
        'SELECT * FROM report_permissions WHERE report_id = $1 ORDER BY permission_type, entity_name',
        [id]
    );

    report.permissions = permResult.rows;

    return report;
};

export const createReportS = async (payload, userId) => {
    const {
        report_name, description, module, main_table,
        columns, column_display_names, column_order,
        joins, expressions, filters, sorting,
        group_by, aggregates, having
    } = payload;

    const result = await pool.query(`
        INSERT INTO report_master (
            report_name, description, module, main_table,
            columns, column_display_names, column_order,
            joins, expressions, filters, sorting,
            group_by, aggregates, "having",
            created_by, created_at, version
        ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10, $11,
            $12, $13, $14,
            $15, NOW(), 1
        ) RETURNING *
    `, [
        report_name, description || null, module || null, main_table,
        JSON.stringify(columns || []), JSON.stringify(column_display_names || {}), JSON.stringify(column_order || []),
        JSON.stringify(joins || []), JSON.stringify(expressions || []), JSON.stringify(filters || []), JSON.stringify(sorting || []),
        JSON.stringify(group_by || []), JSON.stringify(aggregates || []), JSON.stringify(having || []),
        userId
    ]);

    return result.rows[0];
};

export const updateReportS = async (id, payload, userId) => {
    // Get current version for history
    const current = await pool.query(
        'SELECT * FROM report_master WHERE id = $1 AND is_deleted = FALSE',
        [id]
    );

    if (current.rows.length === 0) {
        throw new Error('Report not found');
    }

    const currentReport = current.rows[0];

    // Save version history
    await pool.query(`
        INSERT INTO report_version_history (report_id, version, metadata, changed_by, changed_at, change_description)
        VALUES ($1, $2, $3, $4, NOW(), $5)
    `, [
        id,
        currentReport.version,
        JSON.stringify(currentReport),
        userId,
        payload.change_description || 'Updated report configuration'
    ]);

    const {
        report_name, description, module, status, main_table,
        columns, column_display_names, column_order,
        joins, expressions, filters, sorting,
        group_by, aggregates, having
    } = payload;

    const result = await pool.query(`
        UPDATE report_master SET
            report_name = COALESCE($1, report_name),
            description = COALESCE($2, description),
            module = COALESCE($3, module),
            status = COALESCE($4, status),
            main_table = COALESCE($5, main_table),
            columns = COALESCE($6, columns),
            column_display_names = COALESCE($7, column_display_names),
            column_order = COALESCE($8, column_order),
            joins = COALESCE($9, joins),
            expressions = COALESCE($10, expressions),
            filters = COALESCE($11, filters),
            sorting = COALESCE($12, sorting),
            group_by = COALESCE($13, group_by),
            aggregates = COALESCE($14, aggregates),
            "having" = COALESCE($15, "having"),
            updated_by = $16,
            updated_at = NOW(),
            version = version + 1
        WHERE id = $17 AND is_deleted = FALSE
        RETURNING *
    `, [
        report_name || null, description !== undefined ? description : null, module || null, status || null, main_table || null,
        columns ? JSON.stringify(columns) : null, column_display_names ? JSON.stringify(column_display_names) : null, column_order ? JSON.stringify(column_order) : null,
        joins ? JSON.stringify(joins) : null, expressions ? JSON.stringify(expressions) : null, filters ? JSON.stringify(filters) : null, sorting ? JSON.stringify(sorting) : null,
        group_by ? JSON.stringify(group_by) : null, aggregates ? JSON.stringify(aggregates) : null, having ? JSON.stringify(having) : null,
        userId, id
    ]);

    return result.rows[0];
};

export const deleteReportS = async (id, userId) => {
    const result = await pool.query(`
        UPDATE report_master
        SET is_deleted = TRUE, deleted_by = $2, deleted_at = NOW()
        WHERE id = $1 AND is_deleted = FALSE
        RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
        throw new Error('Report not found');
    }

    return { success: true, message: 'Report deleted' };
};

export const duplicateReportS = async (id, userId) => {
    const original = await getReportByIdS(id);

    const result = await pool.query(`
        INSERT INTO report_master (
            report_name, description, module, main_table,
            columns, column_display_names, column_order,
            joins, expressions, filters, sorting,
            group_by, aggregates, "having",
            created_by, created_at, version
        ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10, $11,
            $12, $13, $14,
            $15, NOW(), 1
        ) RETURNING *
    `, [
        original.report_name + ' (Copy)',
        original.description,
        original.module,
        original.main_table,
        JSON.stringify(original.columns || []),
        JSON.stringify(original.column_display_names || {}),
        JSON.stringify(original.column_order || []),
        JSON.stringify(original.joins || []),
        JSON.stringify(original.expressions || []),
        JSON.stringify(original.filters || []),
        JSON.stringify(original.sorting || []),
        JSON.stringify(original.group_by || []),
        JSON.stringify(original.aggregates || []),
        JSON.stringify(original.having || []),
        userId
    ]);

    return result.rows[0];
};

// ═══════════════════════════════════════════════════════════════
// REPORT PREVIEW & EXECUTION
// ═══════════════════════════════════════════════════════════════

export const previewReportS = async (reportConfig) => {
    const startTime = Date.now();
    const builder = new QueryBuilder(reportConfig);

    await builder.validateIdentifiers();

    const { sql, params } = builder.buildQuery({ isPreview: true });

    console.log('[Preview] SQL:', sql);
    console.log('[Preview] Params:', params);

    const result = await pool.query({
        text: sql,
        values: params,
        statement_timeout: 30000,
    });

    const executionTime = Date.now() - startTime;

    // Build columns metadata
    const columnOrder = reportConfig.column_order || [];
    const displayNames = reportConfig.column_display_names || {};
    const columns = [];

    for (const key of columnOrder) {
        const header = displayNames[key] || key.split('.').pop() || key;
        columns.push({ field: key, header });
    }
    for (const agg of reportConfig.aggregates || []) {
        columns.push({ field: agg.alias, header: agg.alias });
    }
    for (const expr of reportConfig.expressions || []) {
        columns.push({ field: expr.alias, header: expr.displayName || expr.alias });
    }

    console.log('[Preview] Rows:', result.rows.length, 'Columns:', columns.length);

    return {
        columns,
        data: result.rows,
        sql,
        executionTime,
        rowCount: result.rows.length,
    };
};

export const generateSqlS = async (reportConfig) => {
    const builder = new QueryBuilder(reportConfig);
    await builder.validateIdentifiers();
    const { sql, params } = builder.buildQuery({ isPreview: true });
    return { sql, params };
};

export const executeReportS = async (id, options, userId, ipAddress) => {
    const startTime = Date.now();
    const { page, pageSize, filters, sorting, search } = options;

    const reportResult = await pool.query(
        'SELECT * FROM report_master WHERE id = $1 AND is_deleted = FALSE',
        [id]
    );

    if (reportResult.rows.length === 0) {
        throw new Error('Report not found');
    }

    const reportConfig = reportResult.rows[0];
    const builder = new QueryBuilder(reportConfig);

    await builder.validateIdentifiers();

    // Build data query
    const { sql, params } = builder.buildQuery({ page, pageSize, filters, sorting, search });

    // Build count query
    const countBuilder = new QueryBuilder(reportConfig);
    const countQuery = countBuilder.buildQuery({ filters, search, isCount: true });

    console.log('[AdminReportExec] Report:', reportConfig.report_name);
    console.log('[AdminReportExec] SQL:', sql);
    console.log('[AdminReportExec] Params:', params);

    // Execute both
    const [dataResult, countResult] = await Promise.all([
        pool.query({ text: sql, values: params, statement_timeout: 30000 }),
        pool.query({ text: countQuery.sql, values: countQuery.params, statement_timeout: 30000 }),
    ]);

    const executionTime = Date.now() - startTime;
    const totalRows = parseInt(countResult.rows[0]?.total || 0);

    console.log('[AdminReportExec] Rows returned:', dataResult.rows.length, 'Total:', totalRows);

    // Log execution
    await pool.query(
        `INSERT INTO report_execution_log (report_id, executed_by, execution_time_ms, row_count, filters_applied, status, ip_address)
         VALUES ($1, $2, $3, $4, $5, 'success', $6)`,
        [id, userId, executionTime, totalRows, JSON.stringify(filters || {}), ipAddress || null]
    );

    // Build columns metadata for frontend
    const columnOrder = reportConfig.column_order || [];
    const displayNames = reportConfig.column_display_names || {};
    const columns = [];

    for (const key of columnOrder) {
        const header = displayNames[key] || key.split('.').pop() || key;
        columns.push({ field: key, header });
    }
    for (const agg of reportConfig.aggregates || []) {
        columns.push({ field: agg.alias, header: agg.alias });
    }
    for (const expr of reportConfig.expressions || []) {
        columns.push({ field: expr.alias, header: expr.displayName || expr.alias });
    }

    return {
        columns,
        data: dataResult.rows,
        totalRows,
        executionTime,
        sql,
    };
};

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const getReportPermissionsS = async (reportId) => {
    const result = await pool.query(
        'SELECT * FROM report_permissions WHERE report_id = $1 ORDER BY permission_type, entity_name',
        [reportId]
    );
    return result.rows;
};

export const updateReportPermissionsS = async (reportId, permissions) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete existing permissions
        await client.query('DELETE FROM report_permissions WHERE report_id = $1', [reportId]);

        // Insert new permissions
        for (const perm of permissions) {
            await client.query(`
                INSERT INTO report_permissions (report_id, permission_type, entity_id, entity_name, can_view, can_create, can_update, can_delete, can_export)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                reportId,
                perm.permission_type,
                perm.entity_id,
                perm.entity_name || null,
                perm.can_view ?? false,
                perm.can_create ?? false,
                perm.can_update ?? false,
                perm.can_delete ?? false,
                perm.can_export ?? false
            ]);
        }

        await client.query('COMMIT');
        return { success: true, message: 'Permissions updated' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getRolesS = async () => {
    const result = await pool.query(
        `SELECT DISTINCT role FROM users WHERE role IS NOT NULL ORDER BY role`
    );
    return result.rows.map(r => r.role);
};

export const getUsersS = async () => {
    const result = await pool.query(
        `SELECT id, emp_id, emp_name, role FROM users ORDER BY emp_name`
    );
    return result.rows;
};
