/**
 * Shared SQL Builder for Multi-Sheet Reports
 * Used by: preview-table, execute-multi, export/multi-excel
 */

/**
 * Safe JSON stringify for JSONB array fields
 */
export function toJsonb(val) {
    if (typeof val === 'string') return val;
    return JSON.stringify(val || []);
}

/**
 * Safe JSON stringify for JSONB object fields
 */
export function toJsonbObj(val) {
    if (typeof val === 'string') return val;
    return JSON.stringify(val || {});
}

/**
 * Build SQL query for a single table configuration.
 *
 * @param {Object} config - Table configuration from report_tables row
 * @param {Object} options - { limit, offset, filters, sorting }
 * @returns {{ text: string, values: Array }}
 */
export function buildTableSQL(config, options = {}) {
    const { limit, filters = {}, sorting: runtimeSorting, dateFrom, dateTo } = options;

    const columns = config.columns || [];
    const columnOrder = config.column_order || [];
    const joins = config.joins || [];
    const expressions = config.expressions || [];
    const reportFilters = config.filters || [];
    const configSorting = runtimeSorting || config.sorting || [];
    const groupBy = config.group_by || [];
    const aggregates = config.aggregates || [];
    const havingConds = config.having || [];

    // 1. Build SELECT
    const selectParts = [];
    for (const key of columnOrder) {
        const parts = key.split('.');
        const table = parts[0];
        const column = parts[1];
        selectParts.push(`"${table}"."${column}" AS "${column}"`);
    }
    for (const agg of aggregates) {
        if (agg.column === '*') {
            selectParts.push(`${agg.function}(*) AS "${agg.alias}"`);
        } else {
            const col = agg.column.split('.').pop();
            selectParts.push(`${agg.function}("${col}") AS "${agg.alias}"`);
        }
    }
    for (const expr of expressions) {
        let safeExpr = expr.expression;
        // Validate - block dangerous keywords
        const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'TRUNCATE'];
        for (const word of dangerous) {
            if (new RegExp(`\\b${word}\\b`, 'gi').test(safeExpr)) {
                throw new Error(`Forbidden keyword in expression: ${word}`);
            }
        }
        if (safeExpr.includes('--') || safeExpr.includes('/*') || safeExpr.includes('*/') || safeExpr.includes(';')) {
            throw new Error('Forbidden pattern in expression');
        }
        selectParts.push(`(${safeExpr}) AS "${expr.alias}"`);
    }
    const selectClause = selectParts.length > 0 ? selectParts.join(', ') : '*';

    // 2. Build FROM + JOINs
    let fromClause = `FROM "${config.main_table}"`;
    for (const join of joins) {
        const jt = ['INNER', 'LEFT', 'RIGHT', 'FULL'].includes(join.joinType) ? join.joinType : 'INNER';
        fromClause += ` ${jt} JOIN "${join.rightTable}" ON "${join.leftTable}"."${join.leftColumn}" = "${join.rightTable}"."${join.rightColumn}"`;
    }

    // 3. Build WHERE from runtime filters
    const params = [];
    const conditions = [];
    for (const [key, value] of Object.entries(filters)) {
        if (!value || value === '') continue;
        const column = key.split('.').pop();
        const filterConfig = reportFilters.find(f => f.column === key);
        if (filterConfig?.filterType === 'daterange') {
            if (value.from) { params.push(value.from); conditions.push(`"${column}" >= $${params.length}`); }
            if (value.to) { params.push(value.to); conditions.push(`"${column}" <= $${params.length}`); }
        } else if (filterConfig?.filterType === 'number') {
            params.push(Number(value)); conditions.push(`"${column}" = $${params.length}`);
        } else {
            params.push(`%${value}%`); conditions.push(`"${column}" ILIKE $${params.length}`);
        }
    }
    // Date range filter on created_at (or first date column)
    if (dateFrom || dateTo) {
        const PREFERRED = ['created_at', 'entry_date', 'draw_date', 'created_date', 'date'];
        const allCols = columns.map(c => ({ col: c.column, type: c.dataType }));
        let dateCol = null;
        for (const pref of PREFERRED) {
            const found = allCols.find(c => c.col === pref && c.type && (c.type.includes('date') || c.type.includes('timestamp')));
            if (found) { dateCol = found.col; break; }
        }
        if (!dateCol) {
            const anyDate = allCols.find(c => c.type && (c.type.includes('date') || c.type.includes('timestamp')));
            if (anyDate) dateCol = anyDate.col;
        }
        // Fallback: try created_at directly (common column not always in selected columns)
        if (!dateCol) dateCol = 'created_at';

        if (dateFrom) { params.push(dateFrom); conditions.push(`"${dateCol}" >= $${params.length}`); }
        if (dateTo) { params.push(dateTo + ' 23:59:59'); conditions.push(`"${dateCol}" <= $${params.length}`); }
    }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 4. GROUP BY
    let groupByClause = '';
    if (groupBy.length > 0) {
        groupByClause = 'GROUP BY ' + groupBy.map(g => `"${g.split('.').pop()}"`).join(', ');
    }

    // 5. HAVING
    let havingClause = '';
    if (havingConds.length > 0) {
        havingClause = 'HAVING ' + havingConds.map(h => `${h.expression} ${h.operator} ${h.value}`).join(' AND ');
    }

    // 6. ORDER BY
    let orderByClause = '';
    if (configSorting.length > 0) {
        orderByClause = 'ORDER BY ' + configSorting.map(s => {
            const col = s.column.split('.').pop();
            return `"${col}" ${s.direction === 'DESC' ? 'DESC' : 'ASC'}`;
        }).join(', ');
    }

    // 7. LIMIT
    const limitClause = limit ? `LIMIT ${Math.min(Number(limit), 10000)}` : '';

    // 8. Assemble
    const text = `SELECT ${selectClause} ${fromClause} ${whereClause} ${groupByClause} ${havingClause} ${orderByClause} ${limitClause}`.trim();

    return { text, values: params };
}

/**
 * Build column definitions from a table config (for frontend rendering)
 */
export function buildColumnDefs(config) {
    const columnOrder = config.column_order || [];
    const displayNames = config.column_display_names || {};
    const expressions = config.expressions || [];
    const aggregates = config.aggregates || [];

    const columnDefs = columnOrder.map(key => ({
        field: key.split('.').pop(),
        header: displayNames[key] || key.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));
    for (const expr of expressions) {
        columnDefs.push({ field: expr.alias, header: expr.displayName || expr.name || expr.alias });
    }
    for (const agg of aggregates) {
        columnDefs.push({ field: agg.alias, header: agg.alias.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) });
    }
    return columnDefs;
}
