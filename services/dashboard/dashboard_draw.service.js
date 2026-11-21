import pool from "../../db/postgres.js";

export const getDrawTowersDashboardS = async () => {
  // 1. Enabled towers
  const towerRes = await pool.query(
    `SELECT tower_no FROM draw_tower WHERE disable = false ORDER BY tower_no ASC`
  );
  const towerNos = towerRes.rows.map((r) => Number(r.tower_no));
  if (towerNos.length === 0) return [];

  // 2. Open allocations for those towers, newest first
  const allocRes = await pool.query(
    `SELECT preform_id, product_type, tower_no
       FROM preform_allocation
      WHERE preform_draw = false
        AND tower_no <> '0'
        AND tower_no = ANY($1::text[])
      ORDER BY allocation_date DESC, allocation_id DESC`,
    [towerNos.map(String)]
  );

  const preformByTower = new Map();
  const extraCount = new Map();
  for (const row of allocRes.rows) {
    const t = Number(row.tower_no);
    if (preformByTower.has(t)) {
      extraCount.set(t, (extraCount.get(t) || 0) + 1);
    } else {
      preformByTower.set(t, {
        preform_id: row.preform_id,
        product_type: row.product_type,
      });
    }
  }
  for (const [t, n] of extraCount) {
    console.warn(
      `[dashboard/draw-towers] Tower ${t} has ${n + 1} open preform allocations; using most recent (${preformByTower.get(t).preform_id})`
    );
  }

  // 3. Draw entries for all selected preforms
  const preformIds = [...new Set([...preformByTower.values()].map((p) => p.preform_id))];
  const spoolsByPreform = new Map();
  if (preformIds.length > 0) {
    const spoolRes = await pool.query(
      `SELECT spool_id, preform_id, drawn_weight, drawn_length
         FROM draw_entry
        WHERE preform_id = ANY($1::varchar[])
        ORDER BY start_date ASC, start_time ASC`,
      [preformIds]
    );
    const num = (v) => (v === null || v === undefined ? null : Number(v));
    for (const s of spoolRes.rows) {
      if (!spoolsByPreform.has(s.preform_id)) spoolsByPreform.set(s.preform_id, []);
      spoolsByPreform.get(s.preform_id).push({
        spool_id: s.spool_id,
        drawn_weight: num(s.drawn_weight),
        drawn_length: num(s.drawn_length),
      });
    }
  }

  return towerNos.map((tower_no) => {
    const preform = preformByTower.get(tower_no) || null;
    return {
      tower_no,
      preform,
      spools: preform ? spoolsByPreform.get(preform.preform_id) || [] : [],
    };
  });
};
