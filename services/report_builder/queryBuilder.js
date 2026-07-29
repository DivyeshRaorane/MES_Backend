import pool from "../../db/postgres.js";

// Cache for table/column metadata (5 min TTL)
let metadataCache = { tables: null, columns: {}, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

const refreshCacheIfNeeded = async () => {
    if (Date.now() - metadataCache.timestamp < CACHE_TTL && metadataCache.tables) return;

    const tablesResult = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);
    metadataCache.tables = tablesResult.rows.map(r => r.table_name);

    const columnsResult = await pool.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    `);

    metadataCache.columns = {};
    for (const row of columnsResult.rows) {
        if (!metadataCache.columns[row.table_name]) {
            metadataCache.columns[row.table_name] = [];
        }
        metadataCache.columns[row.table_name].push({ column_name: row.column_name, data_type: row.data_type });
    }

    metadataCache.timestamp = Date.now();
};

export const invalidateMetadataCache = () => {
    metadataCache = { tables: null, columns: {}, timestamp: 0 };
};

export class QueryBuilder {
    constructor(reportConfig) {
        this.config = reportConfig;
        this.params = [];
        this.paramIndex = 0;
    }

    async validateIdentifiers() {
        await refreshCacheIfNeeded();

        const tables = new Set();
        tables.add(this.config.main_table);

        for (const join of this.config.joins || []) {
            tables.add(join.leftTable);
            tables.add(join.rightTable);
        }

        for (const tableName of tables) {
            if (!metadataCache.tables.includes(tableName)) {
                throw new Error(`Invalid table: "${tableName}" does not exist`);
            }
        }

        // Validate columns
        for (const col of this.config.columns || []) {
            const tableColumns = metadataCache.columns[col.table];
            if (!tableColumns) {
                throw new Error(`Invalid table: "${col.table}" does not exist`);
            }
            if (!tableColumns.find(c => c.column_name === col.column)) {
                throw new Error(`Invalid column: "${col.column}" does not exist in table "${col.table}"`);
            }
        }

        // Validate column_order references
        for (const key of this.config.column_order || []) {
            const [table, column] = key.split('.');
            if (!table || !column) continue;
            const tableColumns = metadataCache.columns[table];
            if (!tableColumns) {
                throw new Error(`Invalid table in column_order: "${table}"`);
            }
            if (!tableColumns.find(c => c.column_name === column)) {
                throw new Error(`Invalid column in column_order: "${column}" in table "${table}"`);
            }
        }
    }

    buildQuery(options = {}) {
        const { page, pageSize, filters, sorting, search, isCount, isPreview } = options;

        this.params = [];
        this.paramIndex = 0;

        let sql = '';

        if (isCount) {
            const groupBy = this.buildGroupByClause();
            if (groupBy) {
                // For aggregate/GROUP BY reports, wrap in subquery to count distinct groups
                const selectClause = this.buildSelectClause();
                const fromClause = this.buildFromClause();
                const joinClauses = this.buildJoinClauses();
                const whereClause = this.buildWhereClause(filters, search);
                const havingClause = this.buildHavingClause();
                sql = `SELECT COUNT(*) as total FROM (${selectClause} ${fromClause} ${joinClauses} ${whereClause} ${groupBy} ${havingClause}) as count_query`;
            } else {
                sql += 'SELECT COUNT(*) as total';
                sql += ' ' + this.buildFromClause();
                sql += ' ' + this.buildJoinClauses();
                sql += ' ' + this.buildWhereClause(filters, search);
            }

            return { sql: sql.replace(/\s+/g, ' ').trim(), params: this.params };
        }

        // SELECT clause
        sql += this.buildSelectClause();

        // FROM clause
        sql += ' ' + this.buildFromClause();

        // JOIN clauses
        sql += ' ' + this.buildJoinClauses();

        // WHERE clause
        sql += ' ' + this.buildWhereClause(filters, search);

        // GROUP BY clause
        sql += ' ' + this.buildGroupByClause();

        // HAVING clause
        sql += ' ' + this.buildHavingClause();

        // ORDER BY clause
        sql += ' ' + this.buildOrderByClause(sorting);

        // LIMIT/OFFSET
        sql += ' ' + this.buildPaginationClause(page, pageSize, isPreview);

        return { sql: sql.replace(/\s+/g, ' ').trim(), params: this.params };
    }

    buildSelectClause() {
        const parts = [];
        const columns = this.config.columns || [];

        // Regular columns from column_order (with per-column aggregate support)
        for (const key of this.config.column_order || []) {
            const [table, column] = key.split('.');
            if (!table || !column) continue;

            const colDef = columns.find(c => c.table === table && c.column === column);
            const ref = `"${table}"."${column}"`;

            if (colDef?.aggregate === 'COUNT_DISTINCT') {
                parts.push(`COUNT(DISTINCT ${ref}) AS "${key}"`);
            } else if (colDef?.aggregate) {
                const fn = this.validateAggregateFunction(colDef.aggregate);
                parts.push(`${fn}(${ref}) AS "${key}"`);
            } else {
                parts.push(`${ref} AS "${key}"`);
            }
        }

        // Old-style aggregate columns (from aggregates array - backward compat)
        for (const agg of this.config.aggregates || []) {
            const fn = this.validateAggregateFunction(agg.function);
            if (agg.column === '*') {
                parts.push(`${fn}(*) AS "${agg.alias}"`);
            } else {
                const [table, column] = agg.column.split('.');
                if (fn === 'COUNT DISTINCT') {
                    parts.push(`COUNT(DISTINCT "${table}"."${column}") AS "${agg.alias}"`);
                } else {
                    parts.push(`${fn}("${table}"."${column}") AS "${agg.alias}"`);
                }
            }
        }

        // Expression columns
        for (const expr of this.config.expressions || []) {
            const safeExpr = this.validateExpression(expr.expression);
            parts.push(`(${safeExpr}) AS "${expr.alias}"`);
        }

        return `SELECT ${parts.length > 0 ? parts.join(', ') : '*'}`;
    }

    buildFromClause() {
        return `FROM "${this.config.main_table}"`;
    }

    buildJoinClauses() {
        let sql = '';
        for (const join of this.config.joins || []) {
            const joinType = this.validateJoinType(join.joinType);
            sql += ` ${joinType} JOIN "${join.rightTable}" ON "${join.leftTable}"."${join.leftColumn}" = "${join.rightTable}"."${join.rightColumn}"`;
        }
        return sql;
    }

    buildWhereClause(filters, search) {
        const conditions = [];

        if (filters && typeof filters === 'object') {
            for (const [key, value] of Object.entries(filters)) {
                if (value === '' || value === null || value === undefined) continue;

                const [table, column] = key.split('.');
                if (!table || !column) continue;

                const filterConfig = (this.config.filters || []).find(f => f.column === key);

                switch (filterConfig?.filterType) {
                    case 'daterange':
                        if (value.from) {
                            this.paramIndex++;
                            conditions.push(`"${table}"."${column}" >= $${this.paramIndex}`);
                            this.params.push(value.from);
                        }
                        if (value.to) {
                            this.paramIndex++;
                            conditions.push(`"${table}"."${column}" <= $${this.paramIndex}`);
                            this.params.push(value.to);
                        }
                        break;

                    case 'multiselect':
                        if (Array.isArray(value) && value.length > 0) {
                            this.paramIndex++;
                            conditions.push(`"${table}"."${column}" = ANY($${this.paramIndex})`);
                            this.params.push(value);
                        }
                        break;

                    case 'checkbox':
                        this.paramIndex++;
                        conditions.push(`"${table}"."${column}" = $${this.paramIndex}`);
                        this.params.push(value === true || value === 'true');
                        break;

                    case 'number':
                        this.paramIndex++;
                        conditions.push(`"${table}"."${column}" = $${this.paramIndex}`);
                        this.params.push(Number(value));
                        break;

                    case 'dropdown':
                    case 'autocomplete':
                        this.paramIndex++;
                        conditions.push(`"${table}"."${column}" = $${this.paramIndex}`);
                        this.params.push(value);
                        break;

                    default: // text
                        this.paramIndex++;
                        conditions.push(`"${table}"."${column}"::text ILIKE $${this.paramIndex}`);
                        this.params.push(`%${value}%`);
                }
            }
        }

        // Global search across text columns
        if (search) {
            const searchConditions = [];
            for (const col of this.config.columns || []) {
                if (['character varying', 'text', 'character'].includes(col.dataType)) {
                    this.paramIndex++;
                    searchConditions.push(`"${col.table}"."${col.column}"::text ILIKE $${this.paramIndex}`);
                    this.params.push(`%${search}%`);
                }
            }
            if (searchConditions.length > 0) {
                conditions.push(`(${searchConditions.join(' OR ')})`);
            }
        }

        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }

    /**
     * Detect if this report uses aggregates (per-column, old-style aggregates array, or expressions with agg functions)
     */
    isAggregateReport() {
        const columns = this.config.columns || [];
        const expressions = this.config.expressions || [];
        const aggregates = this.config.aggregates || [];

        const hasColumnAggregates = columns.some(c => c.aggregate);
        const AGG_KEYWORDS = ['SUM(', 'COUNT(', 'AVG(', 'MIN(', 'MAX(', 'STRING_AGG(', 'ARRAY_AGG('];
        const hasExpressionAggregates = expressions.some(e =>
            AGG_KEYWORDS.some(k => e.expression.toUpperCase().includes(k))
        );

        return hasColumnAggregates || hasExpressionAggregates || aggregates.length > 0;
    }

    buildGroupByClause() {
        const columns = this.config.columns || [];
        const oldGroupBy = this.config.group_by || [];

        if (this.isAggregateReport()) {
            const allGroupBy = [];

            // Columns explicitly marked groupBy OR columns without aggregate (auto GROUP BY)
            for (const key of this.config.column_order || []) {
                const [table, column] = key.split('.');
                if (!table || !column) continue;

                const colDef = columns.find(c => c.table === table && c.column === column);
                // Include in GROUP BY if: explicitly marked groupBy=true, or no aggregate function set
                const isGroupBy = colDef?.groupBy === true || !colDef?.aggregate;
                if (isGroupBy) {
                    const ref = `"${table}"."${column}"`;
                    if (!allGroupBy.includes(ref)) allGroupBy.push(ref);
                }
            }

            // Also include old-style group_by array entries (backward compat)
            for (const key of oldGroupBy) {
                const [table, column] = key.split('.');
                if (!table || !column) continue;
                const ref = `"${table}"."${column}"`;
                if (!allGroupBy.includes(ref)) allGroupBy.push(ref);
            }

            return allGroupBy.length > 0 ? `GROUP BY ${allGroupBy.join(', ')}` : '';
        }

        // Non-aggregate report: only use old-style explicit group_by if present
        if (oldGroupBy.length === 0) return '';

        const parts = oldGroupBy.map(key => {
            const [table, column] = key.split('.');
            return `"${table}"."${column}"`;
        });

        return `GROUP BY ${parts.join(', ')}`;
    }

    buildHavingClause() {
        const having = this.config.having || [];
        if (having.length === 0) return '';

        const conditions = having.map(h => {
            const safeExpr = this.validateExpression(h.expression);
            this.paramIndex++;
            this.params.push(h.value);
            return `${safeExpr} ${this.validateOperator(h.operator)} $${this.paramIndex}`;
        });

        return `HAVING ${conditions.join(' AND ')}`;
    }

    buildOrderByClause(sorting) {
        const sortRules = sorting && sorting.length > 0 ? sorting : (this.config.sorting || []);
        if (sortRules.length === 0) return '';

        const parts = sortRules.map(s => {
            const [table, column] = s.column.split('.');
            const dir = s.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            return `"${table}"."${column}" ${dir}`;
        });

        return `ORDER BY ${parts.join(', ')}`;
    }

    buildPaginationClause(page, pageSize, isPreview) {
        if (isPreview) return 'LIMIT 100';

        if (!page && !pageSize) return 'LIMIT 50';

        const limit = Math.min(pageSize || 50, 500);
        const offset = ((page || 1) - 1) * limit;

        this.paramIndex++;
        this.params.push(limit);
        this.paramIndex++;
        this.params.push(offset);

        return `LIMIT $${this.paramIndex - 1} OFFSET $${this.paramIndex}`;
    }

    // ─── Validation Methods ───────────────────────────────

    validateJoinType(type) {
        const allowed = ['INNER', 'LEFT', 'RIGHT', 'FULL'];
        return allowed.includes(type?.toUpperCase()) ? type.toUpperCase() : 'LEFT';
    }

    validateAggregateFunction(fn) {
        const allowed = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'COUNT DISTINCT', 'COUNT_DISTINCT'];
        const upper = fn?.toUpperCase();
        return allowed.includes(upper) ? upper : 'COUNT';
    }

    validateOperator(op) {
        const allowed = ['=', '!=', '>', '<', '>=', '<=', '<>', 'LIKE', 'ILIKE'];
        return allowed.includes(op) ? op : '=';
    }

    validateExpression(expr) {
        if (!expr || typeof expr !== 'string') {
            throw new Error('Expression must be a non-empty string');
        }

        // Only block actual SQL injection keywords (all alphabetic - safe for regex)
        const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
            'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'TRUNCATE'];

        for (const word of dangerous) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(expr)) {
                throw new Error(`Invalid expression: contains forbidden keyword "${word}"`);
            }
        }

        // Check dangerous patterns via string includes (NOT regex)
        if (expr.includes('--') || expr.includes('/*') || expr.includes('*/') || expr.includes(';')) {
            throw new Error('Invalid expression: contains forbidden pattern');
        }

        return expr;
    }
}

export default QueryBuilder;
