-- Fix: cast to_char labels to VARCHAR to match RETURNS TABLE declaration
CREATE OR REPLACE FUNCTION public.fn_production_trend_summary(p_date DATE)
RETURNS TABLE (
    metric_name VARCHAR,
    target_val NUMERIC,
    on_date_val NUMERIC,
    cumm_val NUMERIC,
    m1_label VARCHAR, m1_val NUMERIC,
    m2_label VARCHAR, m2_val NUMERIC,
    m3_label VARCHAR, m3_val NUMERIC,
    m4_label VARCHAR, m4_val NUMERIC,
    m5_label VARCHAR, m5_val NUMERIC,
    m6_label VARCHAR, m6_val NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH params AS (
        SELECT
            p_date AS ondate,
            date_trunc('month', p_date)::date AS month_start,
            (p_date - 1) AS cumm_end
    ),
    months AS (
        SELECT
            n AS month_offset,
            (date_trunc('month', p_date) - (n || ' months')::interval)::date AS m_start,
            ((date_trunc('month', p_date) - (n || ' months')::interval)
                + interval '1 month' - interval '1 day')::date AS m_end,
            to_char(date_trunc('month', p_date) - (n || ' months')::interval, 'Mon-YY')::VARCHAR AS m_label
        FROM generate_series(1, 6) AS n
    ),
    month_labels AS (
        SELECT 
            MAX(CASE WHEN month_offset = 1 THEN m_label END)::VARCHAR AS l1,
            MAX(CASE WHEN month_offset = 2 THEN m_label END)::VARCHAR AS l2,
            MAX(CASE WHEN month_offset = 3 THEN m_label END)::VARCHAR AS l3,
            MAX(CASE WHEN month_offset = 4 THEN m_label END)::VARCHAR AS l4,
            MAX(CASE WHEN month_offset = 5 THEN m_label END)::VARCHAR AS l5,
            MAX(CASE WHEN month_offset = 6 THEN m_label END)::VARCHAR AS l6
        FROM months
    ),
    draw_ondate AS (
        SELECT COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS val
        FROM public.draw_entry de CROSS JOIN params p WHERE de.entry_date = p.ondate
    ),
    draw_cumm AS (
        SELECT COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS val
        FROM public.draw_entry de CROSS JOIN params p WHERE de.entry_date BETWEEN p.month_start AND p.cumm_end
    ),
    draw_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS val
        FROM months m LEFT JOIN public.draw_entry de ON de.entry_date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    preform_ondate AS (
        SELECT COUNT(DISTINCT de.spool_id)::NUMERIC AS val
        FROM public.draw_entry de CROSS JOIN params p WHERE de.entry_date = p.ondate
    ),
    preform_cumm AS (
        SELECT COUNT(DISTINCT de.spool_id)::NUMERIC AS val
        FROM public.draw_entry de CROSS JOIN params p WHERE de.entry_date BETWEEN p.month_start AND p.cumm_end
    ),
    preform_monthly AS (
        SELECT m.month_offset, COUNT(DISTINCT de.spool_id)::NUMERIC AS val
        FROM months m LEFT JOIN public.draw_entry de ON de.entry_date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    nobreak_ondate AS (
        SELECT COUNT(DISTINCT de.spool_id)::NUMERIC AS val
        FROM public.draw_entry de CROSS JOIN params p
        WHERE de.entry_date = p.ondate AND de.indication_fiber_cut IS DISTINCT FROM 'Draw Break'
    ),
    nobreak_cumm AS (
        SELECT COUNT(DISTINCT de.spool_id)::NUMERIC AS val
        FROM public.draw_entry de CROSS JOIN params p
        WHERE de.entry_date BETWEEN p.month_start AND p.cumm_end AND de.indication_fiber_cut IS DISTINCT FROM 'Draw Break'
    ),
    nobreak_monthly AS (
        SELECT m.month_offset, COUNT(DISTINCT de.spool_id)::NUMERIC AS val
        FROM months m LEFT JOIN public.draw_entry de ON de.entry_date BETWEEN m.m_start AND m.m_end AND de.indication_fiber_cut IS DISTINCT FROM 'Draw Break'
        GROUP BY m.month_offset
    ),
    brk_ondate AS (
        SELECT COALESCE(SUM(de.drawn_length) FILTER (WHERE de.indication_fiber_cut = 'Draw Break'), 0)::NUMERIC / 10000 AS val
        FROM public.draw_entry de CROSS JOIN params p WHERE de.entry_date = p.ondate
    ),
    brk_cumm AS (
        SELECT COALESCE(SUM(de.drawn_length) FILTER (WHERE de.indication_fiber_cut = 'Draw Break'), 0)::NUMERIC / 10000 AS val
        FROM public.draw_entry de CROSS JOIN params p WHERE de.entry_date BETWEEN p.month_start AND p.cumm_end
    ),
    brk_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(de.drawn_length) FILTER (WHERE de.indication_fiber_cut = 'Draw Break'), 0)::NUMERIC / 10000 AS val
        FROM months m LEFT JOIN public.draw_entry de ON de.entry_date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    ptbrk_ondate AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.is_break = TRUE), 0)::NUMERIC / 1000 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry = p.ondate
    ),
    ptbrk_cumm AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.is_break = TRUE), 0)::NUMERIC / 1000 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry BETWEEN p.month_start AND p.cumm_end
    ),
    ptbrk_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.is_break = TRUE), 0)::NUMERIC / 1000 AS val
        FROM months m LEFT JOIN public.pt_entry pe ON pe.pt_entry BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    lumps_ondate AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'L-Lumps'), 0)::NUMERIC / 1000 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry = p.ondate
    ),
    lumps_cumm AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'L-Lumps'), 0)::NUMERIC / 1000 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry BETWEEN p.month_start AND p.cumm_end
    ),
    lumps_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'L-Lumps'), 0)::NUMERIC / 1000 AS val
        FROM months m LEFT JOIN public.pt_entry pe ON pe.pt_entry BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    bfd_ondate AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'B-BFD'), 0)::NUMERIC / 1000 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry = p.ondate
    ),
    bfd_cumm AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'B-BFD'), 0)::NUMERIC / 1000 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry BETWEEN p.month_start AND p.cumm_end
    ),
    bfd_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'B-BFD'), 0)::NUMERIC / 1000 AS val
        FROM months m LEFT JOIN public.pt_entry pe ON pe.pt_entry BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    ftr_ondate AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (
            WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> '' AND be.final_grade NOT IN ('REW', 'Fail')
        ), 0)::NUMERIC AS good_len
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.final_grade_date = p.ondate
    ),
    ftr_cumm AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (
            WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> '' AND be.final_grade NOT IN ('REW', 'Fail')
        ), 0)::NUMERIC AS good_len
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.final_grade_date BETWEEN p.month_start AND p.cumm_end
    ),
    ftr_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(be.fiber_length) FILTER (
            WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> '' AND be.final_grade NOT IN ('REW', 'Fail')
        ), 0)::NUMERIC AS good_len
        FROM months m LEFT JOIN public.bobbin_entries be ON be.final_grade_date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    rew_ondate AS (
        SELECT COALESCE(SUM(fr.total_length), 0)::NUMERIC AS val
        FROM public.fg_rewind fr CROSS JOIN params p WHERE fr.date = p.ondate
    ),
    rew_cumm AS (
        SELECT COALESCE(SUM(fr.total_length), 0)::NUMERIC AS val
        FROM public.fg_rewind fr CROSS JOIN params p WHERE fr.date BETWEEN p.month_start AND p.cumm_end
    ),
    rew_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(fr.total_length), 0)::NUMERIC AS val
        FROM months m LEFT JOIN public.fg_rewind fr ON fr.date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    fail_ondate AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade = 'Fail'), 0)::NUMERIC AS val
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.final_grade_date = p.ondate
    ),
    fail_cumm AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade = 'Fail'), 0)::NUMERIC AS val
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.final_grade_date BETWEEN p.month_start AND p.cumm_end
    ),
    fail_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade = 'Fail'), 0)::NUMERIC AS val
        FROM months m LEFT JOIN public.bobbin_entries be ON be.final_grade_date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    avgpack_ondate AS (
        SELECT COALESCE(SUM(pob.length_km), 0)::NUMERIC AS total_len, NULLIF(COUNT(pob.bobbin_no), 0)::NUMERIC AS bobbin_count
        FROM public.packing_order po INNER JOIN public.packing_order_bobbin pob ON pob.packing_order = po.order_no
        CROSS JOIN params p WHERE po.updated_at::date = p.ondate
    ),
    avgpack_cumm AS (
        SELECT COALESCE(SUM(pob.length_km), 0)::NUMERIC AS total_len, NULLIF(COUNT(pob.bobbin_no), 0)::NUMERIC AS bobbin_count
        FROM public.packing_order po INNER JOIN public.packing_order_bobbin pob ON pob.packing_order = po.order_no
        CROSS JOIN params p WHERE po.updated_at::date BETWEEN p.month_start AND p.cumm_end
    ),
    avgpack_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(pob.length_km), 0)::NUMERIC AS total_len, NULLIF(COUNT(pob.bobbin_no), 0)::NUMERIC AS bobbin_count
        FROM months m LEFT JOIN public.packing_order po ON po.updated_at::date BETWEEN m.m_start AND m.m_end
        LEFT JOIN public.packing_order_bobbin pob ON pob.packing_order = po.order_no
        GROUP BY m.month_offset
    ),
    avgspool_ondate AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''), 0)::NUMERIC AS total_len,
            NULLIF(COUNT(DISTINCT de.spool_id), 0)::NUMERIC AS spool_count
        FROM public.draw_entry de INNER JOIN public.bobbin_entries be ON be.spool_id = de.spool_id
        CROSS JOIN params p WHERE de.entry_date = p.ondate
    ),
    avgspool_cumm AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''), 0)::NUMERIC AS total_len,
            NULLIF(COUNT(DISTINCT de.spool_id), 0)::NUMERIC AS spool_count
        FROM public.draw_entry de INNER JOIN public.bobbin_entries be ON be.spool_id = de.spool_id
        CROSS JOIN params p WHERE de.entry_date BETWEEN p.month_start AND p.cumm_end
    ),
    avgspool_monthly AS (
        SELECT m.month_offset,
            COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''), 0)::NUMERIC AS total_len,
            NULLIF(COUNT(DISTINCT de.spool_id), 0)::NUMERIC AS spool_count
        FROM months m LEFT JOIN public.draw_entry de ON de.entry_date BETWEEN m.m_start AND m.m_end
        LEFT JOIN public.bobbin_entries be ON be.spool_id = de.spool_id
        GROUP BY m.month_offset
    ),
    ftrew_ondate AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade = 'REW' AND LENGTH(be.fid) = 12), 0)::NUMERIC AS rew_len,
            COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''), 0)::NUMERIC AS total_graded_len
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.final_grade_date = p.ondate
    ),
    ftrew_cumm AS (
        SELECT COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade = 'REW' AND LENGTH(be.fid) = 12), 0)::NUMERIC AS rew_len,
            COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''), 0)::NUMERIC AS total_graded_len
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.final_grade_date BETWEEN p.month_start AND p.cumm_end
    ),
    ftrew_monthly AS (
        SELECT m.month_offset,
            COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade = 'REW' AND LENGTH(be.fid) = 12), 0)::NUMERIC AS rew_len,
            COALESCE(SUM(be.fiber_length) FILTER (WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''), 0)::NUMERIC AS total_graded_len
        FROM months m LEFT JOIN public.bobbin_entries be ON be.final_grade_date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    scrap_ondate AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC / 35.714 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry = p.ondate
    ),
    scrap_cumm AS (
        SELECT COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC / 35.714 AS val
        FROM public.pt_entry pe CROSS JOIN params p WHERE pe.pt_entry BETWEEN p.month_start AND p.cumm_end
    ),
    scrap_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC / 35.714 AS val
        FROM months m LEFT JOIN public.pt_entry pe ON pe.pt_entry BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    pack_ondate AS (
        SELECT COALESCE(SUM(po.required_km) FILTER (WHERE po.is_packed = TRUE), 0)::NUMERIC AS val
        FROM public.packing_order po CROSS JOIN params p WHERE po.updated_at::date = p.ondate
    ),
    pack_cumm AS (
        SELECT COALESCE(SUM(po.required_km) FILTER (WHERE po.is_packed = TRUE), 0)::NUMERIC AS val
        FROM public.packing_order po CROSS JOIN params p WHERE po.updated_at::date BETWEEN p.month_start AND p.cumm_end
    ),
    pack_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(po.required_km) FILTER (WHERE po.is_packed = TRUE), 0)::NUMERIC AS val
        FROM months m LEFT JOIN public.packing_order po ON po.updated_at::date BETWEEN m.m_start AND m.m_end
        GROUP BY m.month_offset
    ),
    desp_ondate AS (
        SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.dispatch_status = 'YES' AND be.dispatched_date = p.ondate
    ),
    desp_cumm AS (
        SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
        FROM public.bobbin_entries be CROSS JOIN params p WHERE be.dispatch_status = 'YES' AND be.dispatched_date BETWEEN p.month_start AND p.cumm_end
    ),
    desp_monthly AS (
        SELECT m.month_offset, COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
        FROM months m LEFT JOIN public.bobbin_entries be ON be.dispatched_date BETWEEN m.m_start AND m.m_end AND be.dispatch_status = 'YES'
        GROUP BY m.month_offset
    ),
    stock_short AS (
        SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
        FROM public.bobbin_entries be
        WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''
          AND be.final_grade NOT IN ('REW', 'Fail') AND be.dispatch_status = 'NO' AND be.fiber_length < 12.6
    ),
    stock_mid AS (
        SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
        FROM public.bobbin_entries be
        WHERE be.final_grade IS NOT NULL AND TRIM(be.final_grade) <> ''
          AND be.final_grade NOT IN ('REW', 'Fail') AND be.dispatch_status = 'NO'
          AND be.fiber_length >= 12.6 AND be.fiber_length < 25.2
    )
    SELECT 'Total Drawn Km'::VARCHAR, NULL::NUMERIC, ROUND(do_.val,1), ROUND(dc.val,1),
        ml.l1, ROUND((SELECT val FROM draw_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM draw_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM draw_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM draw_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM draw_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM draw_monthly WHERE month_offset=6),1)
    FROM draw_ondate do_, draw_cumm dc, month_labels ml
    UNION ALL
    SELECT 'Drawn Preform (No)'::VARCHAR, NULL::NUMERIC, ROUND(po.val,1), ROUND(pc.val,1),
        ml.l1, ROUND((SELECT val FROM preform_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM preform_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM preform_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM preform_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM preform_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM preform_monthly WHERE month_offset=6),1)
    FROM preform_ondate po, preform_cumm pc, month_labels ml
    UNION ALL
    SELECT 'Drawn Preform without Break'::VARCHAR, NULL::NUMERIC, ROUND(nbo.val,1), ROUND(nbc.val,1),
        ml.l1, ROUND((SELECT val FROM nobreak_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM nobreak_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM nobreak_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM nobreak_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM nobreak_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM nobreak_monthly WHERE month_offset=6),1)
    FROM nobreak_ondate nbo, nobreak_cumm nbc, month_labels ml
    UNION ALL
    SELECT 'Draw Breaks/10000'::VARCHAR, 1::NUMERIC, ROUND(bo.val,1), ROUND(bc.val,1),
        ml.l1, ROUND((SELECT val FROM brk_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM brk_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM brk_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM brk_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM brk_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM brk_monthly WHERE month_offset=6),1)
    FROM brk_ondate bo, brk_cumm bc, month_labels ml
    UNION ALL
    SELECT 'PT Breaks/1000'::VARCHAR, 1::NUMERIC, ROUND(pbo.val,1), ROUND(pbc.val,1),
        ml.l1, ROUND((SELECT val FROM ptbrk_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM ptbrk_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM ptbrk_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM ptbrk_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM ptbrk_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM ptbrk_monthly WHERE month_offset=6),1)
    FROM ptbrk_ondate pbo, ptbrk_cumm pbc, month_labels ml
    UNION ALL
    SELECT 'Lumps/1000'::VARCHAR, 1::NUMERIC, ROUND(lo.val,1), ROUND(lc.val,1),
        ml.l1, ROUND((SELECT val FROM lumps_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM lumps_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM lumps_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM lumps_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM lumps_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM lumps_monthly WHERE month_offset=6),1)
    FROM lumps_ondate lo, lumps_cumm lc, month_labels ml
    UNION ALL
    SELECT 'BFD/1000'::VARCHAR, 1::NUMERIC, ROUND(bfo.val,1), ROUND(bfc.val,1),
        ml.l1, ROUND((SELECT val FROM bfd_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM bfd_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM bfd_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM bfd_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM bfd_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM bfd_monthly WHERE month_offset=6),1)
    FROM bfd_ondate bfo, bfd_cumm bfc, month_labels ml
    UNION ALL
    SELECT 'FTR %'::VARCHAR, 80.5::NUMERIC,
        ROUND(fo.good_len / NULLIF(do2.val,0) * 100, 1), ROUND(fc.good_len / NULLIF(dc2.val,0) * 100, 1),
        ml.l1, ROUND((SELECT good_len FROM ftr_monthly WHERE month_offset=1) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=1), 0) * 100, 1),
        ml.l2, ROUND((SELECT good_len FROM ftr_monthly WHERE month_offset=2) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=2), 0) * 100, 1),
        ml.l3, ROUND((SELECT good_len FROM ftr_monthly WHERE month_offset=3) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=3), 0) * 100, 1),
        ml.l4, ROUND((SELECT good_len FROM ftr_monthly WHERE month_offset=4) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=4), 0) * 100, 1),
        ml.l5, ROUND((SELECT good_len FROM ftr_monthly WHERE month_offset=5) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=5), 0) * 100, 1),
        ml.l6, ROUND((SELECT good_len FROM ftr_monthly WHERE month_offset=6) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=6), 0) * 100, 1)
    FROM ftr_ondate fo, ftr_cumm fc, draw_ondate do2, draw_cumm dc2, month_labels ml
    UNION ALL
    SELECT 'Fibre Km Sent for Rew'::VARCHAR, NULL::NUMERIC, ROUND(ro.val,1), ROUND(rc.val,1),
        ml.l1, ROUND((SELECT val FROM rew_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM rew_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM rew_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM rew_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM rew_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM rew_monthly WHERE month_offset=6),1)
    FROM rew_ondate ro, rew_cumm rc, month_labels ml
    UNION ALL
    SELECT 'Fibre Km Sent for Rew %'::VARCHAR, NULL::NUMERIC,
        ROUND(ro2.val / NULLIF(do3.val,0) * 100, 1), ROUND(rc2.val / NULLIF(dc3.val,0) * 100, 1),
        ml.l1, ROUND((SELECT val FROM rew_monthly WHERE month_offset=1) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=1), 0) * 100, 1),
        ml.l2, ROUND((SELECT val FROM rew_monthly WHERE month_offset=2) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=2), 0) * 100, 1),
        ml.l3, ROUND((SELECT val FROM rew_monthly WHERE month_offset=3) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=3), 0) * 100, 1),
        ml.l4, ROUND((SELECT val FROM rew_monthly WHERE month_offset=4) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=4), 0) * 100, 1),
        ml.l5, ROUND((SELECT val FROM rew_monthly WHERE month_offset=5) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=5), 0) * 100, 1),
        ml.l6, ROUND((SELECT val FROM rew_monthly WHERE month_offset=6) / NULLIF((SELECT val FROM draw_monthly WHERE month_offset=6), 0) * 100, 1)
    FROM rew_ondate ro2, rew_cumm rc2, draw_ondate do3, draw_cumm dc3, month_labels ml
    UNION ALL
    SELECT 'Total Failed Km'::VARCHAR, NULL::NUMERIC, ROUND(flo.val,1), ROUND(flc.val,1),
        ml.l1, ROUND((SELECT val FROM fail_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM fail_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM fail_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM fail_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM fail_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM fail_monthly WHERE month_offset=6),1)
    FROM fail_ondate flo, fail_cumm flc, month_labels ml
    UNION ALL
    SELECT 'Average Pack Length'::VARCHAR, NULL::NUMERIC,
        ROUND(apo.total_len / apo.bobbin_count, 1), ROUND(apc.total_len / apc.bobbin_count, 1),
        ml.l1, ROUND((SELECT total_len / bobbin_count FROM avgpack_monthly WHERE month_offset=1), 1),
        ml.l2, ROUND((SELECT total_len / bobbin_count FROM avgpack_monthly WHERE month_offset=2), 1),
        ml.l3, ROUND((SELECT total_len / bobbin_count FROM avgpack_monthly WHERE month_offset=3), 1),
        ml.l4, ROUND((SELECT total_len / bobbin_count FROM avgpack_monthly WHERE month_offset=4), 1),
        ml.l5, ROUND((SELECT total_len / bobbin_count FROM avgpack_monthly WHERE month_offset=5), 1),
        ml.l6, ROUND((SELECT total_len / bobbin_count FROM avgpack_monthly WHERE month_offset=6), 1)
    FROM avgpack_ondate apo, avgpack_cumm apc, month_labels ml
    UNION ALL
    SELECT 'Average Main Spool Length'::VARCHAR, NULL::NUMERIC,
        ROUND(aso.total_len / aso.spool_count, 1), ROUND(asc2.total_len / asc2.spool_count, 1),
        ml.l1, ROUND((SELECT total_len / spool_count FROM avgspool_monthly WHERE month_offset=1), 1),
        ml.l2, ROUND((SELECT total_len / spool_count FROM avgspool_monthly WHERE month_offset=2), 1),
        ml.l3, ROUND((SELECT total_len / spool_count FROM avgspool_monthly WHERE month_offset=3), 1),
        ml.l4, ROUND((SELECT total_len / spool_count FROM avgspool_monthly WHERE month_offset=4), 1),
        ml.l5, ROUND((SELECT total_len / spool_count FROM avgspool_monthly WHERE month_offset=5), 1),
        ml.l6, ROUND((SELECT total_len / spool_count FROM avgspool_monthly WHERE month_offset=6), 1)
    FROM avgspool_ondate aso, avgspool_cumm asc2, month_labels ml
    UNION ALL
    SELECT 'First time Rew %'::VARCHAR, NULL::NUMERIC,
        ROUND(fro.rew_len / NULLIF(fro.total_graded_len,0) * 100, 1), ROUND(frc.rew_len / NULLIF(frc.total_graded_len,0) * 100, 1),
        ml.l1, ROUND((SELECT rew_len FROM ftrew_monthly WHERE month_offset=1) / NULLIF((SELECT total_graded_len FROM ftrew_monthly WHERE month_offset=1),0) * 100, 1),
        ml.l2, ROUND((SELECT rew_len FROM ftrew_monthly WHERE month_offset=2) / NULLIF((SELECT total_graded_len FROM ftrew_monthly WHERE month_offset=2),0) * 100, 1),
        ml.l3, ROUND((SELECT rew_len FROM ftrew_monthly WHERE month_offset=3) / NULLIF((SELECT total_graded_len FROM ftrew_monthly WHERE month_offset=3),0) * 100, 1),
        ml.l4, ROUND((SELECT rew_len FROM ftrew_monthly WHERE month_offset=4) / NULLIF((SELECT total_graded_len FROM ftrew_monthly WHERE month_offset=4),0) * 100, 1),
        ml.l5, ROUND((SELECT rew_len FROM ftrew_monthly WHERE month_offset=5) / NULLIF((SELECT total_graded_len FROM ftrew_monthly WHERE month_offset=5),0) * 100, 1),
        ml.l6, ROUND((SELECT rew_len FROM ftrew_monthly WHERE month_offset=6) / NULLIF((SELECT total_graded_len FROM ftrew_monthly WHERE month_offset=6),0) * 100, 1)
    FROM ftrew_ondate fro, ftrew_cumm frc, month_labels ml
    UNION ALL
    SELECT 'Preform Kg Scrapped'::VARCHAR, NULL::NUMERIC, ROUND(sco.val,1), ROUND(scc.val,1),
        ml.l1, ROUND((SELECT val FROM scrap_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM scrap_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM scrap_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM scrap_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM scrap_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM scrap_monthly WHERE month_offset=6),1)
    FROM scrap_ondate sco, scrap_cumm scc, month_labels ml
    UNION ALL
    SELECT 'Total Packing'::VARCHAR, NULL::NUMERIC, ROUND(pko.val,1), ROUND(pkc.val,1),
        ml.l1, ROUND((SELECT val FROM pack_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM pack_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM pack_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM pack_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM pack_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM pack_monthly WHERE month_offset=6),1)
    FROM pack_ondate pko, pack_cumm pkc, month_labels ml
    UNION ALL
    SELECT 'Despatched Qty'::VARCHAR, NULL::NUMERIC, ROUND(dso.val,1), ROUND(dsc.val,1),
        ml.l1, ROUND((SELECT val FROM desp_monthly WHERE month_offset=1),1),
        ml.l2, ROUND((SELECT val FROM desp_monthly WHERE month_offset=2),1),
        ml.l3, ROUND((SELECT val FROM desp_monthly WHERE month_offset=3),1),
        ml.l4, ROUND((SELECT val FROM desp_monthly WHERE month_offset=4),1),
        ml.l5, ROUND((SELECT val FROM desp_monthly WHERE month_offset=5),1),
        ml.l6, ROUND((SELECT val FROM desp_monthly WHERE month_offset=6),1)
    FROM desp_ondate dso, desp_cumm dsc, month_labels ml
    UNION ALL
    SELECT 'Fiber Stock <12.6'::VARCHAR, NULL::NUMERIC, ROUND(ss.val,1), ROUND(ss.val,1),
        ml.l1, ROUND(ss.val,1), ml.l2, ROUND(ss.val,1), ml.l3, ROUND(ss.val,1),
        ml.l4, ROUND(ss.val,1), ml.l5, ROUND(ss.val,1), ml.l6, ROUND(ss.val,1)
    FROM stock_short ss, month_labels ml
    UNION ALL
    SELECT 'Fiber Stock >12.6 <25.2'::VARCHAR, NULL::NUMERIC, ROUND(sm.val,1), ROUND(sm.val,1),
        ml.l1, ROUND(sm.val,1), ml.l2, ROUND(sm.val,1), ml.l3, ROUND(sm.val,1),
        ml.l4, ROUND(sm.val,1), ml.l5, ROUND(sm.val,1), ml.l6, ROUND(sm.val,1)
    FROM stock_mid sm, month_labels ml;
END;
$$;
