import pool from "../../db/postgres.js";
import { QC_UPDATABLE_PARAMS, QC_CONFIG_TABLE } from "./qc_data_update.params.js";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// QC Data Update service
//
// Lets an admin choose which qc_entry_temp parameters may be filled in by hand
// (machine down / manual check) and lets QC users fill them for a preform,
// spool or bobbin selection.
//
//  - qc_data_update_config  : single row (id = 1), one boolean column per parameter.
//  - Only parameters whose flag is TRUE can be updated.
//  - A value is written to qc_entry_temp ONLY where the current value IS NULL.
//  - Blank values are skipped.
//
// Column names are never taken from the request: they are always picked from
// QC_UPDATABLE_PARAMS (whitelist), so dynamic SQL is safe.
// Every function returns { status, message, data } like the fiber_lock service.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const MAX_BOBBINS = 5000;
const MAX_SPOOLS = 500;
const NUMERIC_TYPES = new Set(["numeric", "decimal", "real", "double precision", "smallint", "integer", "bigint"]);
const DATE_TYPES = new Set(["date", "timestamp without time zone", "timestamp with time zone"]);
const NUMBER_RE = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

const q = (name) => `"${name}"`; // only ever called with whitelisted names

const ok = (message, data = null) => ({ status: 200, message, data });
const fail = (status, message) => ({ status, message, data: null });

const cleanId = (v) => (v === null || v === undefined ? "" : String(v).trim());

const uniqueIds = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(cleanId).filter(Boolean))];
};

/* -- config -- */
let ensurePromise = null;
const ensureConfigTable = () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS ${QC_CONFIG_TABLE} (
           id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )`
      );
      const addCols = QC_UPDATABLE_PARAMS
        .map((p) => `ADD COLUMN IF NOT EXISTS ${q(p)} BOOLEAN NOT NULL DEFAULT FALSE`)
        .join(", ");
      await pool.query(`ALTER TABLE ${QC_CONFIG_TABLE} ${addCols}`);
      await pool.query(`INSERT INTO ${QC_CONFIG_TABLE} (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    })().catch((err) => {
      ensurePromise = null; // retry on next request
      throw err;
    });
  }
  return ensurePromise;
};

// column_name -> data_type for qc_entry_temp
const getColumnTypes = async (client = pool) => {
  const r = await client.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'qc_entry_temp'`
  );
  return new Map(r.rows.map((row) => [row.column_name, row.data_type]));
};

const typeKind = (dataType) => {
  if (NUMERIC_TYPES.has(dataType)) return "number";
  if (DATE_TYPES.has(dataType)) return "date";
  return "text";
};

/* -- config -- */
// GET: [{ name, allowed, type }]  (only parameters that exist in qc_entry_temp)
export const getConfigS = async () => {
  await ensureConfigTable();
  const [cfg, types] = await Promise.all([
    pool.query(`SELECT * FROM ${QC_CONFIG_TABLE} WHERE id = 1`),
    getColumnTypes(),
  ]);
  const row = cfg.rows[0] || {};
  const params = QC_UPDATABLE_PARAMS
    .filter((name) => types.has(name))
    .map((name) => ({ name, allowed: row[name] === true, type: typeKind(types.get(name)) }));
  return ok("QC data update config fetched", { params });
};

// PUT: body { params: { <name>: true|false, ... } }  (only the names sent are changed)
export const saveConfigS = async ({ params }) => {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return fail(400, "params object is required");
  }
  const entries = Object.entries(params);
  for (const [name, flag] of entries) {
    if (!QC_UPDATABLE_PARAMS.includes(name)) return fail(400, `Parameter '${name}' cannot be configured`);
    if (typeof flag !== "boolean") return fail(400, `Value for '${name}' must be true or false`);
  }
  await ensureConfigTable();
  if (entries.length > 0) {
    const values = [];
    const sets = entries.map(([name, flag], i) => {
      values.push(flag);
      return `${q(name)} = $${i + 1}`;
    });
    await pool.query(
      `UPDATE ${QC_CONFIG_TABLE}
          SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1`,
      values
    );
  }
  return getConfigS().then((r) => ({ ...r, message: "QC data update config saved" }));
};

/* -- lookups -- */
// Spools of a preform (draw_entry).
export const getSpoolsByPreformS = async (preformId) => {
  const id = cleanId(preformId);
  if (!id) return fail(400, "preform_id is required");
  const r = await pool.query(
    `SELECT spool_id FROM draw_entry WHERE preform_id = $1 ORDER BY spool_id`,
    [id]
  );
  if (r.rows.length === 0) return fail(404, `No spools found for preform ${id}`);
  return ok("Spools fetched", { preform_id: id, spools: r.rows.map((x) => x.spool_id) });
};

// Bobbins (bobbin_entries) that are in qc_entry_temp, grouped per spool: [{ spool_id, bobbins: [bobbin_no] }]
const groupBySpool = (rows, orderedSpools) => {
  const map = new Map(orderedSpools.map((s) => [s, []]));
  for (const row of rows) {
    if (!map.has(row.spool_id)) map.set(row.spool_id, []);
    map.get(row.spool_id).push(row.bobbin_no);
  }
  return [...map.entries()].map(([spool_id, bobbins]) => ({ spool_id, bobbins }));
};

export const getBobbinsBySpoolsS = async (spoolIds) => {
  const ids = uniqueIds(spoolIds);
  if (ids.length === 0) return fail(400, "At least one spool_id is required");
  if (ids.length > MAX_SPOOLS) return fail(400, `Too many spools (max ${MAX_SPOOLS})`);
  const r = await pool.query(
    `SELECT be.spool_id, be.bobbin_no FROM bobbin_entries be
      WHERE be.spool_id = ANY($1::text[]) AND be.bobbin_no IS NOT NULL
        AND EXISTS (SELECT 1 FROM qc_entry_temp t WHERE t.bobbin_no = be.bobbin_no)
      ORDER BY be.spool_id, be.bobbin_no`,
    [ids]
  );
  const spools = groupBySpool(r.rows, ids);
  if (r.rows.length === 0) return fail(404, "No bobbins available for update in the selected spool(s) (must be in qc_entry_temp)");
  return ok("Bobbins fetched", { spools });
};

// Single bobbin lookup -> same shape as getBobbinsBySpoolsS
export const getBobbinByNoS = async (bobbinNo) => {
  const id = cleanId(bobbinNo);
  if (!id) return fail(400, "bobbin_no is required");
  const r = await pool.query(
    `SELECT be.spool_id, be.bobbin_no FROM bobbin_entries be
      WHERE be.bobbin_no = $1
        AND EXISTS (SELECT 1 FROM qc_entry_temp t WHERE t.bobbin_no = be.bobbin_no)`,
    [id]
  );
  if (r.rows.length === 0) return fail(404, `Bobbin ${id} is not available for update (not found or not in qc_entry_temp)`);
  return ok("Bobbin fetched", { spools: groupBySpool(r.rows, []) });
};

/* -- update -- */
// body: { bobbin_nos: [..], values: { <param>: "1.23", ... } }
// For every non-blank value: UPDATE qc_entry_temp SET <param> = value
//                            WHERE bobbin_no IN (...) AND <param> IS NULL
export const updateQcValuesS = async ({ bobbin_nos, values }) => {
  const bobbins = uniqueIds(bobbin_nos);
  if (bobbins.length === 0) return fail(400, "Select at least one bobbin");
  if (bobbins.length > MAX_BOBBINS) return fail(400, `Too many bobbins (max ${MAX_BOBBINS})`);
  if (!values || typeof values !== "object" || Array.isArray(values)) return fail(400, "values object is required");

  // Blank values are skipped.
  const provided = Object.entries(values)
    .map(([name, v]) => [name, v === null || v === undefined ? "" : String(v).trim()])
    .filter(([, v]) => v !== "");
  if (provided.length === 0) return fail(400, "Enter at least one value to update");

  await ensureConfigTable();
  const [cfg, types] = await Promise.all([
    pool.query(`SELECT * FROM ${QC_CONFIG_TABLE} WHERE id = 1`),
    getColumnTypes(),
  ]);
  const allowedRow = cfg.rows[0] || {};

  // Validate everything before touching data.
  const toApply = [];
  for (const [name, raw] of provided) {
    if (!QC_UPDATABLE_PARAMS.includes(name) || !types.has(name)) return fail(400, `Parameter '${name}' cannot be updated`);
    if (allowedRow[name] !== true) return fail(403, `Parameter '${name}' is not enabled for update`);
    const kind = typeKind(types.get(name));
    if (kind === "number" && !(NUMBER_RE.test(raw) && Number.isFinite(Number(raw)))) {
      return fail(400, `'${name}' must be a number`);
    }
    if (kind === "date" && Number.isNaN(Date.parse(raw))) return fail(400, `'${name}' must be a valid date`);
    toApply.push({ name, value: raw });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query(
      `SELECT t.bobbin_no FROM qc_entry_temp t
        WHERE t.bobbin_no = ANY($1::text[])`,
      [bobbins]
    );
    const foundSet = new Set(found.rows.map((r) => r.bobbin_no));
    const notFound = bobbins.filter((b) => !foundSet.has(b));
    const eligible = [...foundSet];

    const results = [];
    for (const { name, value } of toApply) {
      const r = await client.query(
        `UPDATE qc_entry_temp SET ${q(name)} = $1
          WHERE bobbin_no = ANY($2::text[]) AND ${q(name)} IS NULL
          RETURNING bobbin_no`,
        [value, eligible]
      );
      results.push({
        param: name,
        value,
        updated: r.rows.length,
        skipped: foundSet.size - r.rows.length, // already had a value
      });
    }

    await client.query("COMMIT");
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    return ok(
      totalUpdated > 0 ? "QC data updated" : "Nothing updated: all selected values already exist",
      { total_updated: totalUpdated, bobbins_selected: bobbins.length, bobbins_not_in_qc: notFound, results }
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};
