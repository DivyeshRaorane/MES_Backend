import pool from "../../db/postgres.js";

export const getDashboardS = async (filters) => {
    const { date_from, date_to, tower_no, shift } = filters;
    let where = `WHERE de.entry_date BETWEEN $1 AND $2`;
    const params = [date_from, date_to];
    let idx = 3;

    if (tower_no) { where += ` AND de.tower_no = $${idx}`; params.push(tower_no); idx++; }
    if (shift) { where += ` AND de.shift = $${idx}`; params.push(shift); idx++; }

    const main = await pool.query(
        `SELECT COALESCE(SUM(drawn_length),0) AS total_drawn_length,
                COUNT(DISTINCT preform_id) AS total_preforms,
                COUNT(spool_id) AS total_spools,
                COALESCE(AVG(drawn_length),0) AS avg_spool_length,
                COALESCE(SUM(COALESCE(top_end_scrap,0)+COALESCE(bottom_end_scrap,0)),0) AS total_scrap
         FROM draw_entry de ${where}`, params
    );

    const breaks = await pool.query(
        `SELECT COUNT(*) AS total_breaks FROM draw_break_analysis ba
         INNER JOIN draw_entry de ON de.spool_fid = ba.fiber_id ${where}`, params
    );

    const flaws = await pool.query(
        `SELECT COUNT(*) AS total_flaws FROM draw_flaw_details fd
         INNER JOIN draw_entry de ON de.spool_id = fd.spool_id ${where}`, params
    );

    const r = main.rows[0];
    const totalDrawn = Number(r.total_drawn_length) || 0;
    const totalScrap = Number(r.total_scrap) || 0;
    const yield_pct = totalDrawn > 0 ? Math.round((totalDrawn - totalScrap) / totalDrawn * 1000) / 10 : 0;

    return {
        ...r,
        total_breaks: Number(breaks.rows[0].total_breaks),
        total_flaws: Number(flaws.rows[0].total_flaws),
        yield_pct
    };
};

export const getProductionSummaryS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT de.entry_date AS date,
                COUNT(DISTINCT de.preform_id) AS total_preforms,
                SUM(de.drawn_length) AS total_drawn_length,
                SUM(de.drawn_weight) AS total_drawn_weight,
                COUNT(de.spool_id) AS total_spools,
                AVG(de.drawn_length) AS avg_spool_length,
                SUM(COALESCE(de.top_end_scrap,0)+COALESCE(de.bottom_end_scrap,0)) AS total_scrap
         FROM draw_entry de
         WHERE de.entry_date BETWEEN $1 AND $2
         GROUP BY de.entry_date ORDER BY de.entry_date DESC`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getPreformReportS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT pa.preform_id, pa.preform_weight, pa.drawing_length,
                SUM(de.drawn_length) AS actual_length,
                COUNT(de.spool_id) AS total_spools
         FROM preform_accept pa
         LEFT JOIN draw_entry de ON de.preform_id = pa.preform_id
         WHERE pa.entry_date BETWEEN $1 AND $2
         GROUP BY pa.preform_id, pa.preform_weight, pa.drawing_length
         ORDER BY pa.preform_id DESC`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getSpoolReportS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT spool_id, spool_fid, preform_id, start_date, tower_no, shift,
                drawn_length, drawn_weight, spool_status, is_pt_allocate
         FROM draw_entry
         WHERE entry_date BETWEEN $1 AND $2
         ORDER BY entry_date DESC, start_time DESC LIMIT 500`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getFlawReportS = async (filters) => {
    const { date_from, date_to, spool_id } = filters;
    let query = `
        SELECT draw_flaw_id, spool_id, reason, pos1, pos2,
               defect_length, actual_cutting, entry_date, entry_time
        FROM draw_flaw_details WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND entry_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND entry_date <= $${params.length}`; }
    if (spool_id) { params.push(spool_id); query += ` AND spool_id = $${params.length}`; }

    query += ` ORDER BY entry_date DESC, entry_time DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getBreakReportS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT fiber_id, machine_no, break_length, break_type, break_category,
                main_break_type, sub_reason, next_sub_reason, bsa_done_by, created_at
         FROM draw_break_analysis
         WHERE created_at::date BETWEEN $1 AND $2
         ORDER BY created_at DESC`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getTowerPerformanceS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT de.tower_no,
                COUNT(DISTINCT de.preform_id) AS total_preforms,
                SUM(de.drawn_length) AS total_drawn,
                COUNT(de.spool_id) AS total_spools,
                AVG(de.drawn_line_speed) AS avg_speed,
                ROUND((SUM(de.drawn_length) - SUM(COALESCE(de.top_end_scrap,0)+COALESCE(de.bottom_end_scrap,0))) / NULLIF(SUM(de.drawn_length),0) * 100, 1) AS yield_pct
         FROM draw_entry de
         WHERE de.entry_date BETWEEN $1 AND $2
         GROUP BY de.tower_no ORDER BY de.tower_no`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getShiftPerformanceS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT de.shift,
                COUNT(DISTINCT de.preform_id) AS total_preforms,
                SUM(de.drawn_length) AS total_drawn,
                COUNT(de.spool_id) AS total_spools,
                AVG(de.drawn_line_speed) AS avg_speed,
                ROUND((SUM(de.drawn_length) - SUM(COALESCE(de.top_end_scrap,0)+COALESCE(de.bottom_end_scrap,0))) / NULLIF(SUM(de.drawn_length),0) * 100, 1) AS yield_pct
         FROM draw_entry de
         WHERE de.entry_date BETWEEN $1 AND $2
         GROUP BY de.shift ORDER BY de.shift`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getOperatorPerformanceS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT de.shift_incharge AS operator,
                COUNT(DISTINCT de.preform_id) AS total_preforms,
                SUM(de.drawn_length) AS total_drawn,
                COUNT(de.spool_id) AS total_spools,
                AVG(de.drawn_line_speed) AS avg_speed
         FROM draw_entry de
         WHERE de.entry_date BETWEEN $1 AND $2
         GROUP BY de.shift_incharge ORDER BY total_drawn DESC`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getDrawParametersS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT de.shift AS group_key,
                AVG(drawn_line_speed) AS avg_speed, AVG(draw_tension) AS avg_tension,
                AVG(furnace_power) AS avg_furnace_power, AVG(furnace_argon) AS avg_argon,
                AVG(furnace_he) AS avg_he, AVG(co2_flow) AS avg_co2, AVG(n2_flow) AS avg_n2,
                AVG(primary_pressure) AS avg_pri_pressure, AVG(secondary_pressure) AS avg_sec_pressure
         FROM draw_entry de
         WHERE entry_date BETWEEN $1 AND $2
         GROUP BY de.shift`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getScrapAnalysisS = async (filters) => {
    const { date_from, date_to } = filters;
    const result = await pool.query(
        `SELECT de.tower_no AS group_key,
                SUM(top_end_scrap) AS top_scrap, SUM(bottom_end_scrap) AS bottom_scrap,
                SUM(COALESCE(top_end_scrap,0)+COALESCE(bottom_end_scrap,0)) AS total_scrap,
                ROUND(SUM(COALESCE(top_end_scrap,0)+COALESCE(bottom_end_scrap,0)) / NULLIF(SUM(drawn_length),0) * 100, 2) AS scrap_pct
         FROM draw_entry de
         WHERE entry_date BETWEEN $1 AND $2
         GROUP BY de.tower_no ORDER BY de.tower_no`,
        [date_from, date_to]
    );
    return result.rows;
};

export const getPreformAcceptReportS = async (filters) => {
    const { date_from, date_to } = filters;
    let query = `
        SELECT preform_id, preform_weight, charge_weight, preform_length, charge_length,
               drawing_length, material_code, dia_variation, cut_off, mfd, accepted_by,
               preform_type, material_description, remarks, draw_instruction,
               acceptance_status, rejection_note, product_type, entry_date, entry_time
        FROM preform_accept WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND entry_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND entry_date <= $${params.length}`; }

    query += ` ORDER BY entry_date DESC, entry_time DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getHandleJoinReportS = async (filters) => {
    const { date_from, date_to } = filters;
    let query = `
        SELECT preform_id, handle_number, handle_length, handle_diameter, cone_length,
               dia1, dia2, dia3, dia4, dia5,
               h2flow1, h2flow2, h2flow3,
               o2line1_flow1, o2line1_flow2, o2line1_flow3,
               h2flow1_time, h2flow2_time, h2flow3_time,
               o2line1_flow1_time, o2line1_flow2_time, o2line1_flow3_time,
               h2flow1_cons, h2flow2_cons, h2flow3_cons,
               o2line1_flow1_cons, o2line1_flow2_cons, o2line1_flow3_cons,
               joined_by, additional_notes, is_handle_join, is_allocate,
               handle_rejected, entry_date, entry_time
        FROM handle_join WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND entry_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND entry_date <= $${params.length}`; }

    query += ` ORDER BY entry_date DESC, entry_time DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getPreformAllocReportS = async (filters) => {
    const { date_from, date_to, tower_no, shift } = filters;
    let query = `
        SELECT preform_id, allocation_date, tower_no, shift, operator,
               preform_type, product_type, process_type, preform_draw,
               average_diameter, draw_instruction, process_remarks,
               entry_date, entry_time
        FROM preform_allocation WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND allocation_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND allocation_date <= $${params.length}`; }
    if (tower_no) { params.push(tower_no); query += ` AND tower_no = $${params.length}`; }
    if (shift) { params.push(shift); query += ` AND shift = $${params.length}`; }

    query += ` ORDER BY allocation_date DESC, entry_time DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getDrawEntryReportS = async (filters) => {
    const { date_from, date_to, tower_no, shift, preform_id, spool_id } = filters;
    let query = `
        SELECT spool_id, spool_fid, preform_id, tower_no, start_date, end_date,
               start_time, end_time, drawn_weight, drawn_length, balance_weight,
               shift, drawn_line_speed, draw_tension, furnace_power, furnace_argon,
               furnace_he, tube_he, co2_flow, n2_flow, uv_air,
               winding_observation, scr_observation, top_end_scrap, bottom_end_scrap,
               die_clean, spool_status, indication_fiber_cut, indication_reason, remark,
               primary_coating, secondary_coating, coating_type,
               primary_pressure, secondary_pressure, primary_batch, secondary_batch,
               process_type, shift_incharge, furnace_operator, die_operator, ground_operator,
               is_pt_allocate, preform_type, product_type, spool_no, is_first, is_last,
               entry_date, entry_time
        FROM draw_entry WHERE 1=1`;
    const params = [];

    if (date_from) { params.push(date_from); query += ` AND start_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND start_date <= $${params.length}`; }
    if (tower_no) { params.push(tower_no); query += ` AND tower_no = $${params.length}`; }
    if (shift) { params.push(shift); query += ` AND shift = $${params.length}`; }
    if (preform_id) { params.push(preform_id); query += ` AND preform_id = $${params.length}`; }
    if (spool_id) { params.push(spool_id); query += ` AND spool_id = $${params.length}`; }

    query += ` ORDER BY start_date DESC, start_time DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    return result.rows;
};
