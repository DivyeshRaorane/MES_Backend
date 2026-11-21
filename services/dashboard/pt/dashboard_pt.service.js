import pool from "../../../db/postgres.js";

const num = (v) => (v === null || v === undefined ? null : Number(v));

export const getPtMachinesDashboardS = async () => {
  // 1. Every PT machine
  const machineRes = await pool.query(
    `SELECT pt_machine_no FROM pt_machine ORDER BY pt_machine_no ASC`
  );
  const machineNos = machineRes.rows.map((r) => Number(r.pt_machine_no));
  if (machineNos.length === 0) return [];

  // 2. Open allocations on those machines. bobbin_no and fiber_length are not
  //    stored in pt_allocation, they come from bobbin_entries (by spool_id).
  const allocRes = await pool.query(
    `SELECT pa.pt_machine_no,
            pa.spool_id,
            be.bobbin_no,
            be.fiber_length,
            pa.drawn_length
       FROM pt_allocation pa
       LEFT JOIN bobbin_entries be ON be.spool_id = pa.spool_id
      WHERE pa.is_pt_complete = false
        AND pa.pt_machine_no <> 0
        AND pa.pt_machine_no = ANY($1::int[])
      ORDER BY pa.spool_id ASC, be.bobbin_no ASC`,
    [machineNos]
  );

  const byMachine = new Map();
  for (const row of allocRes.rows) {
    const m = Number(row.pt_machine_no);
    if (!byMachine.has(m)) byMachine.set(m, []);
    byMachine.get(m).push({
      spool_id: row.spool_id,
      bobbin_no: row.bobbin_no,
      fiber_length: num(row.fiber_length),
      drawn_length: num(row.drawn_length),
    });
  }

  return machineNos.map((pt_machine_no) => ({
    pt_machine_no,
    allocations: byMachine.get(pt_machine_no) || [],
  }));
};
