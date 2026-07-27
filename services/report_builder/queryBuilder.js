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
            sql += 'SELECT COUNT(*) as total';
            sql += ' ' + this.buildFromClause();
            sql += ' ' + this.buildJoinClauses();
            sql += ' ' + this.buildWhereClause(filters, search);

            const groupBy = this.buildGroupByClause();
            if (groupBy) {
                // For GROUP BY count, wrap in subquery
                const innerSql = this.buildSelectClause() + ' ' + this.buildFromClause() + ' ' + this.buildJoinClauses() + ' ' + this.buildWhereClause(filters, search) + ' ' + groupBy + ' ' + this.buildHavingClause();
                // Reset and rebuild as count wrapper
                this.params = [];
                this.paramIndex = 0;
                const rebuildSelect = this.buildSelectClause();
                const rebuildFrom = this.buildFromClause();
                const rebuildJoins = this.buildJoinClauses();
                const rebuildWhere = this.buildWhereClause(filters, search);
                const rebuildGroup = this.buildGroupByClause();
                const rebuildHaving = this.buildHavingClause();
                sql = `SELECT COUNT(*) as total FROM (${rebuildSelect} ${rebuildFrom} ${rebuildJoins} ${rebuildWhere} ${rebuildGroup} ${rebuildHaving}) as count_query`;
            }

            return { sql: sql.trim(), params: this.params };
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

        // Regular columns from column_order
        for (const key of this.config.column_order || []) {
            const [table, column] = key.split('.');
            if (!table || !column) continue;
            parts.push(`"${table}"."${column}" AS "${key}"`);
        }

        // Aggregate columns
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

    buildGroupByClause() {
        const groupBy = this.config.group_by || [];
        if (groupBy.length === 0) return '';

        const parts = groupBy.map(key => {
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
        const allowed = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'COUNT DISTINCT'];
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
