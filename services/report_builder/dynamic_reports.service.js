import pool from "../../db/postgres.js";
import { QueryBuilder } from "./queryBuilder.js";

// ═══════════════════════════════════════════════════════════════
// HELPER: Build columns metadata for frontend table rendering
// ═══════════════════════════════════════════════════════════════

const buildColumnsMeta = (reportConfig) => {
    const columns = [];
    const columnOrder = reportConfig.column_order || [];
    const displayNames = reportConfig.column_display_names || {};
    const colDefs = reportConfig.columns || [];

    // Regular columns from column_order (with aggregate label support)
    for (const key of columnOrder) {
        const [table, column] = key.split('.');
        const colDef = colDefs.find(c => c.table === table && c.column === column);
        let header = displayNames[key] || key.split('.').pop() || key;

        // Prefix with aggregate function if present
        if (colDef?.aggregate) {
            const aggLabel = colDef.aggregate === 'COUNT_DISTINCT' ? 'COUNT DISTINCT' : colDef.aggregate;
            header = `${aggLabel}(${header})`;
        }

        columns.push({
            field: key,
            header: header,
        });
    }

    // Old-style aggregate columns
    for (const agg of reportConfig.aggregates || []) {
        columns.push({
            field: agg.alias,
            header: agg.alias,
        });
    }

    // Expression columns
    for (const expr of reportConfig.expressions || []) {
        columns.push({
            field: expr.alias,
            header: expr.displayName || expr.alias,
        });
    }

    return columns;
};

// ═══════════════════════════════════════════════════════════════
// USER-FACING DYNAMIC REPORTS
// ═══════════════════════════════════════════════════════════════

export const getUserReportsS = async (user) => {
    const userId = user.id || user.userId;
    const userRole = user.role;

    // Admin gets all active reports
    if (userRole === 'admin') {
        const result = await pool.query(`
            SELECT *
            FROM report_master
            WHERE is_deleted = FALSE AND status = 'active'
            ORDER BY module, report_name
        `);
        return result.rows;
    }

    // Non-admin: filter by permissions
    const result = await pool.query(`
        SELECT DISTINCT rm.*
        FROM report_master rm
        INNER JOIN report_permissions rp ON rm.id = rp.report_id
        WHERE rm.is_deleted = FALSE
        AND rm.status = 'active'
        AND rp.can_view = TRUE
        AND (
            (rp.permission_type = 'role' AND rp.entity_id = $1)
            OR (rp.permission_type = 'user' AND rp.entity_id = $2::text)
        )
        ORDER BY rm.module, rm.report_name
    `, [userRole, String(userId)]);

    return result.rows;
};

export const executeUserReportS = async (id, options, user, ipAddress) => {
    const startTime = Date.now();
    const userId = user.id || user.userId;
    const userRole = user.role;
    const { page, pageSize, filters, sorting, search } = options;

    // Check report exists
    const reportResult = await pool.query(
        'SELECT * FROM report_master WHERE id = $1 AND is_deleted = FALSE AND status = $2',
        [id, 'active']
    );

    if (reportResult.rows.length === 0) {
        throw new Error('Report not found');
    }

    // Check permission (admin always has access)
    if (userRole !== 'admin') {
        const permCheck = await pool.query(`
            SELECT 1 FROM report_permissions
            WHERE report_id = $1 AND can_view = TRUE
            AND (
                (permission_type = 'role' AND entity_id = $2)
                OR (permission_type = 'user' AND entity_id = $3::text)
            )
            LIMIT 1
        `, [id, userRole, String(userId)]);

        if (permCheck.rows.length === 0) {
            throw new Error('Access denied');
        }
    }

    const reportConfig = reportResult.rows[0];
    const builder = new QueryBuilder(reportConfig);

    await builder.validateIdentifiers();

    // Build data query
    const { sql, params } = builder.buildQuery({ page, pageSize, filters, sorting, search });

    // Build count query
    const countBuilder = new QueryBuilder(reportConfig);
    const countQuery = countBuilder.buildQuery({ filters, search, isCount: true });

    console.log('[ReportExec] Report:', reportConfig.report_name);
    console.log('[ReportExec] SQL:', sql);
    console.log('[ReportExec] Params:', params);

    // Execute both
    const [dataResult, countResult] = await Promise.all([
        pool.query({ text: sql, values: params, statement_timeout: 30000 }),
        pool.query({ text: countQuery.sql, values: countQuery.params, statement_timeout: 30000 }),
    ]);

    const executionTime = Date.now() - startTime;
    const totalRows = parseInt(countResult.rows[0]?.total || 0);

    console.log('[ReportExec] Rows returned:', dataResult.rows.length, 'Total:', totalRows);

    // Log execution
    await pool.query(
        `INSERT INTO report_execution_log (report_id, executed_by, execution_time_ms, row_count, filters_applied, status, ip_address)
         VALUES ($1, $2, $3, $4, $5, 'success', $6)`,
        [id, userId, executionTime, totalRows, JSON.stringify(filters || {}), ipAddress || null]
    );

    // Build columns metadata for frontend
    const columns = buildColumnsMeta(reportConfig);

    return {
        columns,
        data: dataResult.rows,
        totalRows,
        executionTime,
        sql,
        reportName: reportConfig.report_name,
        filters: reportConfig.filters || [],
    };
};

export const executeReportForExportS = async (id, options, user) => {
    const userId = user.id || user.userId;
    const userRole = user.role;
    const { filters, sorting, search } = options;

    // Check report exists
    const reportResult = await pool.query(
        'SELECT * FROM report_master WHERE id = $1 AND is_deleted = FALSE AND status = $2',
        [id, 'active']
    );

    if (reportResult.rows.length === 0) {
        throw new Error('Report not found');
    }

    // Check export permission
    if (userRole !== 'admin') {
        const permCheck = await pool.query(`
            SELECT 1 FROM report_permissions
            WHERE report_id = $1 AND can_export = TRUE
            AND (
                (permission_type = 'role' AND entity_id = $2)
                OR (permission_type = 'user' AND entity_id = $3::text)
            )
            LIMIT 1
        `, [id, userRole, String(userId)]);

        if (permCheck.rows.length === 0) {
            throw new Error('Export access denied');
        }
    }

    const reportConfig = reportResult.rows[0];
    const builder = new QueryBuilder(reportConfig);

    await builder.validateIdentifiers();

    // Build query without pagination (but with row limit of 100,000)
    const { sql, params } = builder.buildQuery({ filters, sorting, search, page: 1, pageSize: 100000 });

    console.log('[Export] Report:', reportConfig.report_name);
    console.log('[Export] SQL:', sql);

    const result = await pool.query({
        text: sql,
        values: params,
        statement_timeout: 60000, // 60 seconds for export
    });

    console.log('[Export] Rows:', result.rows.length);

    // Build column order including aggregates and expressions
    const fullColumnOrder = [...(reportConfig.column_order || [])];
    for (const agg of reportConfig.aggregates || []) {
        fullColumnOrder.push(agg.alias);
    }
    for (const expr of reportConfig.expressions || []) {
        fullColumnOrder.push(expr.alias);
    }

    // Build display names including aggregates and expressions
    const fullDisplayNames = { ...(reportConfig.column_display_names || {}) };
    for (const agg of reportConfig.aggregates || []) {
        fullDisplayNames[agg.alias] = agg.alias;
    }
    for (const expr of reportConfig.expressions || []) {
        fullDisplayNames[expr.alias] = expr.displayName || expr.alias;
    }

    return {
        data: result.rows,
        reportName: reportConfig.report_name,
        columnOrder: fullColumnOrder,
        columnDisplayNames: fullDisplayNames,
    };
};

// ═══════════════════════════════════════════════════════════════
// SAVED FILTERS
// ═══════════════════════════════════════════════════════════════

export const getSavedFiltersS = async (reportId, userId) => {
    const result = await pool.query(
        'SELECT * FROM report_saved_filters WHERE report_id = $1 AND user_id = $2 ORDER BY created_at DESC',
        [reportId, userId]
    );
    return result.rows;
};

export const createSavedFilterS = async (reportId, userId, payload) => {
    const { filter_name, filter_values, is_default } = payload;

    // If setting as default, unset previous default
    if (is_default) {
        await pool.query(
            'UPDATE report_saved_filters SET is_default = FALSE WHERE report_id = $1 AND user_id = $2',
            [reportId, userId]
        );
    }

    const result = await pool.query(`
        INSERT INTO report_saved_filters (report_id, user_id, filter_name, filter_values, is_default)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `, [reportId, userId, filter_name, JSON.stringify(filter_values), is_default ?? false]);

    return result.rows[0];
};

export const deleteSavedFilterS = async (filterId, userId) => {
    const result = await pool.query(
        'DELETE FROM report_saved_filters WHERE id = $1 AND user_id = $2 RETURNING id',
        [filterId, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('Saved filter not found');
    }

    return { success: true, message: 'Saved filter deleted' };
};
