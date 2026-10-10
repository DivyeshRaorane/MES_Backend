--
-- PostgreSQL database dump
--

\restrict MyGwg8V8zLg1RUDs5i45dy8Bzbq0du3NElJ3zdsZSxYv5ragSCK7EwpuyxstKRd

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_draw_pt_summary1(date, date, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_pt_summary1(p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_group_by character varying DEFAULT 'PREFORM'::character varying, p_filter_value character varying DEFAULT NULL::character varying) RETURNS TABLE(report_type character varying, preform_id character varying, spool_id character varying, product_type character varying, total_spools bigint, total_drawn_length numeric, total_pt_entries bigint, total_pt_length numeric, real_pt_length numeric, scrap_pt_length numeric, real_pt_entries bigint, scrap_pt_entries bigint, break_count bigint, qc_complete_entries bigint, qc_complete_length numeric, rewind_entries bigint, rewind_length numeric, fail_entries bigint, fail_length numeric, ok_entries bigint, ok_length numeric)
    LANGUAGE sql STABLE
    AS $$

WITH draw_data AS (
    SELECT
        de.preform_id,
        de.spool_id,
        TRIM(de.product_type) || TRIM(de.process_type) AS product_type,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_length
    FROM public.draw_entry de
    WHERE
        (p_start_date IS NULL OR de.start_date >= p_start_date)
        AND (p_end_date IS NULL OR de.start_date <= p_end_date)
        AND (
            p_filter_value IS NULL
            OR (UPPER(p_group_by) = 'PREFORM' AND de.preform_id = p_filter_value)
            OR (UPPER(p_group_by) = 'SPOOL' AND de.spool_id = p_filter_value)
            OR (UPPER(p_group_by) = 'PRODUCT'
                AND (TRIM(de.product_type) || TRIM(de.process_type)) = p_filter_value)
        )
    GROUP BY
        de.preform_id, de.spool_id, TRIM(de.product_type), TRIM(de.process_type)
),

pt_data AS (
    SELECT
        pe.preform_id,
        pe.spool_id,
        COUNT(*) AS total_pt_entries,
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt_length,
        COALESCE(SUM(CASE WHEN pe.fid IS NOT NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END), 0)::NUMERIC AS real_pt_length,
        COALESCE(SUM(CASE WHEN pe.fid IS NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END), 0)::NUMERIC AS scrap_pt_length,
        COUNT(*) FILTER (WHERE pe.fid IS NOT NULL) AS real_pt_entries,
        COUNT(*) FILTER (WHERE pe.fid IS NULL) AS scrap_pt_entries,
        COUNT(*) FILTER (WHERE pe.is_break = TRUE AND pe.fid IS NOT NULL) AS break_count
    FROM public.pt_entry pe
    GROUP BY pe.preform_id, pe.spool_id
),

/* =============================================================
   QC DATA
   Joins qc_entry via pt_entry.bobbin_no (1:1 relationship).

   final_grade = 'REW'  -> rewind bucket (exact match)
   final_grade = 'Fail' -> fail bucket   (exact match)
   Any other grade (e.g. 'A1', 'D', ...)  -> ok bucket
   ============================================================= */
qc_data AS (
    SELECT
        pe.preform_id,
        pe.spool_id,

        COUNT(qe.bobbin_no) AS qc_complete_entries,

        COALESCE(SUM(qe.optical_length), 0)::NUMERIC AS qc_complete_length,

        COUNT(*) FILTER (
            WHERE qe.final_grade = 'REW'
        ) AS rewind_entries,

        COALESCE(
            SUM(CASE WHEN qe.final_grade = 'REW' THEN qe.optical_length ELSE 0 END),
            0
        )::NUMERIC AS rewind_length,

        COUNT(*) FILTER (
            WHERE qe.final_grade = 'Fail'
        ) AS fail_entries,

        COALESCE(
            SUM(CASE WHEN qe.final_grade = 'Fail' THEN qe.optical_length ELSE 0 END),
            0
        )::NUMERIC AS fail_length,

        COUNT(*) FILTER (
            WHERE qe.final_grade IS DISTINCT FROM 'REW'
              AND qe.final_grade IS DISTINCT FROM 'Fail'
        ) AS ok_entries,

        COALESCE(
            SUM(CASE
                    WHEN qe.final_grade IS DISTINCT FROM 'REW'
                     AND qe.final_grade IS DISTINCT FROM 'Fail'
                    THEN qe.optical_length
                    ELSE 0
                END),
            0
        )::NUMERIC AS ok_length

    FROM public.pt_entry pe
    INNER JOIN public.qc_entry qe
        ON qe.bobbin_no = pe.bobbin_no

    GROUP BY pe.preform_id, pe.spool_id
),

common_data AS (
    SELECT
        d.preform_id,
        d.spool_id,
        d.product_type,
        d.drawn_length,
        COALESCE(p.total_pt_entries, 0)::BIGINT AS total_pt_entries,
        COALESCE(p.total_pt_length, 0)::NUMERIC AS total_pt_length,
        COALESCE(p.real_pt_length, 0)::NUMERIC AS real_pt_length,
        COALESCE(p.scrap_pt_length, 0)::NUMERIC AS scrap_pt_length,
        COALESCE(p.real_pt_entries, 0)::BIGINT AS real_pt_entries,
        COALESCE(p.scrap_pt_entries, 0)::BIGINT AS scrap_pt_entries,
        COALESCE(p.break_count, 0)::BIGINT AS break_count,

        COALESCE(q.qc_complete_entries, 0)::BIGINT AS qc_complete_entries,
        COALESCE(q.qc_complete_length, 0)::NUMERIC AS qc_complete_length,
        COALESCE(q.rewind_entries, 0)::BIGINT AS rewind_entries,
        COALESCE(q.rewind_length, 0)::NUMERIC AS rewind_length,
        COALESCE(q.fail_entries, 0)::BIGINT AS fail_entries,
        COALESCE(q.fail_length, 0)::NUMERIC AS fail_length,
        COALESCE(q.ok_entries, 0)::BIGINT AS ok_entries,
        COALESCE(q.ok_length, 0)::NUMERIC AS ok_length

    FROM draw_data d
    LEFT JOIN pt_data p
        ON p.preform_id = d.preform_id
       AND p.spool_id = d.spool_id
    LEFT JOIN qc_data q
        ON q.preform_id = d.preform_id
       AND q.spool_id = d.spool_id
)

SELECT
    'PREFORM'::VARCHAR AS report_type,
    c.preform_id::VARCHAR AS preform_id,
    NULL::VARCHAR AS spool_id,
    NULL::VARCHAR AS product_type,
    COUNT(DISTINCT c.spool_id)::BIGINT AS total_spools,
    COALESCE(SUM(c.drawn_length), 0)::NUMERIC AS total_drawn_length,
    COALESCE(SUM(c.total_pt_entries), 0)::BIGINT AS total_pt_entries,
    COALESCE(SUM(c.total_pt_length), 0)::NUMERIC AS total_pt_length,
    COALESCE(SUM(c.real_pt_length), 0)::NUMERIC AS real_pt_length,
    COALESCE(SUM(c.scrap_pt_length), 0)::NUMERIC AS scrap_pt_length,
    COALESCE(SUM(c.real_pt_entries), 0)::BIGINT AS real_pt_entries,
    COALESCE(SUM(c.scrap_pt_entries), 0)::BIGINT AS scrap_pt_entries,
    COALESCE(SUM(c.break_count), 0)::BIGINT AS break_count,
    COALESCE(SUM(c.qc_complete_entries), 0)::BIGINT AS qc_complete_entries,
    COALESCE(SUM(c.qc_complete_length), 0)::NUMERIC AS qc_complete_length,
    COALESCE(SUM(c.rewind_entries), 0)::BIGINT AS rewind_entries,
    COALESCE(SUM(c.rewind_length), 0)::NUMERIC AS rewind_length,
    COALESCE(SUM(c.fail_entries), 0)::BIGINT AS fail_entries,
    COALESCE(SUM(c.fail_length), 0)::NUMERIC AS fail_length,
    COALESCE(SUM(c.ok_entries), 0)::BIGINT AS ok_entries,
    COALESCE(SUM(c.ok_length), 0)::NUMERIC AS ok_length
FROM common_data c
WHERE UPPER(p_group_by) = 'PREFORM'
GROUP BY c.preform_id

UNION ALL

SELECT
    'SPOOL'::VARCHAR AS report_type,
    c.preform_id::VARCHAR AS preform_id,
    c.spool_id::VARCHAR AS spool_id,
    NULL::VARCHAR AS product_type,
    COUNT(DISTINCT c.spool_id)::BIGINT AS total_spools,
    COALESCE(SUM(c.drawn_length), 0)::NUMERIC AS total_drawn_length,
    COALESCE(SUM(c.total_pt_entries), 0)::BIGINT AS total_pt_entries,
    COALESCE(SUM(c.total_pt_length), 0)::NUMERIC AS total_pt_length,
    COALESCE(SUM(c.real_pt_length), 0)::NUMERIC AS real_pt_length,
    COALESCE(SUM(c.scrap_pt_length), 0)::NUMERIC AS scrap_pt_length,
    COALESCE(SUM(c.real_pt_entries), 0)::BIGINT AS real_pt_entries,
    COALESCE(SUM(c.scrap_pt_entries), 0)::BIGINT AS scrap_pt_entries,
    COALESCE(SUM(c.break_count), 0)::BIGINT AS break_count,
    COALESCE(SUM(c.qc_complete_entries), 0)::BIGINT AS qc_complete_entries,
    COALESCE(SUM(c.qc_complete_length), 0)::NUMERIC AS qc_complete_length,
    COALESCE(SUM(c.rewind_entries), 0)::BIGINT AS rewind_entries,
    COALESCE(SUM(c.rewind_length), 0)::NUMERIC AS rewind_length,
    COALESCE(SUM(c.fail_entries), 0)::BIGINT AS fail_entries,
    COALESCE(SUM(c.fail_length), 0)::NUMERIC AS fail_length,
    COALESCE(SUM(c.ok_entries), 0)::BIGINT AS ok_entries,
    COALESCE(SUM(c.ok_length), 0)::NUMERIC AS ok_length
FROM common_data c
WHERE UPPER(p_group_by) = 'SPOOL'
GROUP BY c.preform_id, c.spool_id

UNION ALL

SELECT
    'PRODUCT'::VARCHAR AS report_type,
    NULL::VARCHAR AS preform_id,
    NULL::VARCHAR AS spool_id,
    c.product_type::VARCHAR AS product_type,
    COUNT(DISTINCT c.spool_id)::BIGINT AS total_spools,
    COALESCE(SUM(c.drawn_length), 0)::NUMERIC AS total_drawn_length,
    COALESCE(SUM(c.total_pt_entries), 0)::BIGINT AS total_pt_entries,
    COALESCE(SUM(c.total_pt_length), 0)::NUMERIC AS total_pt_length,
    COALESCE(SUM(c.real_pt_length), 0)::NUMERIC AS real_pt_length,
    COALESCE(SUM(c.scrap_pt_length), 0)::NUMERIC AS scrap_pt_length,
    COALESCE(SUM(c.real_pt_entries), 0)::BIGINT AS real_pt_entries,
    COALESCE(SUM(c.scrap_pt_entries), 0)::BIGINT AS scrap_pt_entries,
    COALESCE(SUM(c.break_count), 0)::BIGINT AS break_count,
    COALESCE(SUM(c.qc_complete_entries), 0)::BIGINT AS qc_complete_entries,
    COALESCE(SUM(c.qc_complete_length), 0)::NUMERIC AS qc_complete_length,
    COALESCE(SUM(c.rewind_entries), 0)::BIGINT AS rewind_entries,
    COALESCE(SUM(c.rewind_length), 0)::NUMERIC AS rewind_length,
    COALESCE(SUM(c.fail_entries), 0)::BIGINT AS fail_entries,
    COALESCE(SUM(c.fail_length), 0)::NUMERIC AS fail_length,
    COALESCE(SUM(c.ok_entries), 0)::BIGINT AS ok_entries,
    COALESCE(SUM(c.ok_length), 0)::NUMERIC AS ok_length
FROM common_data c
WHERE UPPER(p_group_by) = 'PRODUCT'
GROUP BY c.product_type

ORDER BY report_type, preform_id, spool_id, product_type;

$$;


ALTER FUNCTION public.fn_draw_pt_summary1(p_start_date date, p_end_date date, p_group_by character varying, p_filter_value character varying) OWNER TO postgres;

--
-- Name: fn_draw_shift_report(date, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_shift_report(p_date date DEFAULT CURRENT_DATE, p_shift character varying DEFAULT NULL::character varying) RETURNS TABLE(machine character varying, total_drawn_length numeric, top_end_scrap numeric, bottom_end_scrap numeric, flaw_count bigint, flaw_length numeric)
    LANGUAGE sql STABLE
    AS $$

WITH draw_flaw AS (
    SELECT
        dfd.spool_id,
        COUNT(*) AS flaw_count,
        COALESCE(SUM(dfd.defect_length), 0)::NUMERIC AS flaw_length
    FROM public.draw_flaw_details dfd
    GROUP BY dfd.spool_id
),

filtered_draw AS (
    SELECT
        de.tower_no,
        de.spool_id,
        de.drawn_length,
        de.top_end_scrap,
        de.bottom_end_scrap
    FROM public.draw_entry de
    WHERE de.start_date = p_date
      AND (p_shift IS NULL OR de.shift = UPPER(p_shift))
),

draw_joined AS (
    SELECT
        fd.tower_no,
        fd.drawn_length,
        fd.top_end_scrap,
        fd.bottom_end_scrap,
        COALESCE(df.flaw_count, 0)::BIGINT AS flaw_count,
        COALESCE(df.flaw_length, 0)::NUMERIC AS flaw_length
    FROM filtered_draw fd
    LEFT JOIN draw_flaw df
        ON df.spool_id = fd.spool_id
)

SELECT
    'Draw Tower' || dj.tower_no::text AS machine,

    COALESCE(SUM(dj.drawn_length), 0)::NUMERIC AS total_drawn_length,
    COALESCE(SUM(dj.top_end_scrap), 0)::NUMERIC AS top_end_scrap,
    COALESCE(SUM(dj.bottom_end_scrap), 0)::NUMERIC AS bottom_end_scrap,
    COALESCE(SUM(dj.flaw_count), 0)::BIGINT AS flaw_count,
    COALESCE(SUM(dj.flaw_length), 0)::NUMERIC AS flaw_length

FROM draw_joined dj
GROUP BY dj.tower_no
ORDER BY machine;

$$;


ALTER FUNCTION public.fn_draw_shift_report(p_date date, p_shift character varying) OWNER TO postgres;

--
-- Name: fn_draw_shift_wise_report(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_shift_wise_report(p_start_date date, p_end_date date) RETURNS TABLE(report_date date, shift character varying, total_entries bigint, total_drawn_weight numeric, total_drawn_length numeric, total_top_end_scrap numeric, total_bottom_end_scrap numeric, first_start_time time without time zone, last_end_time time without time zone)
    LANGUAGE sql STABLE
    AS $$
    SELECT
        de.start_date AS report_date,

        COALESCE(de.shift, 'UNKNOWN')::VARCHAR AS shift,

        COUNT(*) AS total_entries,

        COALESCE(SUM(de.drawn_weight), 0)::NUMERIC
            AS total_drawn_weight,

        COALESCE(SUM(de.drawn_length), 0)::NUMERIC
            AS total_drawn_length,

        COALESCE(SUM(de.top_end_scrap), 0)::NUMERIC
            AS total_top_end_scrap,

        COALESCE(SUM(de.bottom_end_scrap), 0)::NUMERIC
            AS total_bottom_end_scrap,

        MIN(de.start_time) AS first_start_time,

        MAX(de.end_time) AS last_end_time

    FROM public.draw_entry de

    WHERE de.start_date BETWEEN p_start_date AND p_end_date

    GROUP BY
        de.start_date,
        de.shift

    ORDER BY
        de.start_date,
        CASE de.shift
            WHEN 'A' THEN 1
            WHEN 'B' THEN 2
            WHEN 'C' THEN 3
            WHEN 'G' THEN 4
            ELSE 5
        END;
$$;


ALTER FUNCTION public.fn_draw_shift_wise_report(p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: fn_draw_tower_oee_report(date, date, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_tower_oee_report(p_start_date date DEFAULT CURRENT_DATE, p_end_date date DEFAULT NULL::date, p_rated_speed numeric DEFAULT 2.5) RETURNS TABLE(machine character varying, rated_speed numeric, total_time numeric, production numeric, planned_timeloss numeric, planned_prod_time numeric, downtime numeric, operating_time numeric, availability numeric, performance numeric, quality numeric, oee numeric, defect_kms numeric, defect_pt numeric, defect_drrej numeric, defect_fail numeric, defect_rew numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_start_date AS start_date,
        COALESCE(p_end_date, p_start_date) AS end_date
),
 
day_count AS (
    SELECT (end_date - start_date + 1)::NUMERIC AS days
    FROM params
),
 
towers AS (
    SELECT dt.tower_no
    FROM public.draw_tower dt
    WHERE dt.is_active = TRUE
      AND COALESCE(dt.disable, FALSE) = FALSE
),
 
production AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS production
    FROM public.draw_entry de, params p
    WHERE de.start_date BETWEEN p.start_date AND p.end_date
    GROUP BY de.tower_no
),
 
shift_plan AS (
    SELECT
        dsp.tower_no,
        COALESCE(SUM(dsp.downtime), 0)::NUMERIC AS downtime,
        (COALESCE(SUM(dsp.pm_tl), 0) + COALESCE(SUM(dsp.ch_ov_tl), 0))::NUMERIC AS planned_timeloss
    FROM public.draw_shift_plan dsp, params p
    WHERE dsp.plan_date BETWEEN p.start_date AND p.end_date
    GROUP BY dsp.tower_no
),
 
pt_defects AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length) FILTER (
            WHERE pe.fid IS NULL
              AND COALESCE(pe.rejection, FALSE) = FALSE
              AND COALESCE(pe.bal_draw_rejection, FALSE) = FALSE
        ), 0)::NUMERIC AS defect_pt,
        COALESCE(SUM(pe.pt_length) FILTER (
            WHERE pe.fid IS NULL
              AND (COALESCE(pe.rejection, FALSE) = TRUE
                   OR COALESCE(pe.bal_draw_rejection, FALSE) = TRUE)
        ), 0)::NUMERIC AS defect_drrej
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.start_date AND p.end_date
    GROUP BY pe.tower_no
),
 
qc_defects AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(qe.optical_length) FILTER (WHERE qe.final_grade = 'Fail'), 0)::NUMERIC AS defect_fail,
        COALESCE(SUM(qe.optical_length) FILTER (WHERE qe.final_grade = 'REW'), 0)::NUMERIC AS defect_rew
    FROM public.qc_entry qe
    JOIN public.pt_entry pe ON pe.bobbin_no = qe.bobbin_no
    CROSS JOIN params p
    WHERE pe.pt_entry BETWEEN p.start_date AND p.end_date
    GROUP BY pe.tower_no
),
 
combined AS (
    SELECT
        t.tower_no,
        p_rated_speed AS rated_speed,
        (1440 * dc.days) AS total_time,
        COALESCE(pr.production, 0)::NUMERIC AS production,
        COALESCE(sp.planned_timeloss, 0)::NUMERIC AS planned_timeloss,
        (1440 * dc.days) - COALESCE(sp.planned_timeloss, 0)::NUMERIC AS planned_prod_time,
        COALESCE(sp.downtime, 0)::NUMERIC AS downtime,
        (1440 * dc.days)
            - COALESCE(sp.planned_timeloss, 0)::NUMERIC
            - COALESCE(sp.downtime, 0)::NUMERIC AS operating_time,
        COALESCE(ptd.defect_pt, 0)::NUMERIC AS defect_pt,
        COALESCE(ptd.defect_drrej, 0)::NUMERIC AS defect_drrej,
        COALESCE(qcd.defect_fail, 0)::NUMERIC AS defect_fail,
        COALESCE(qcd.defect_rew, 0)::NUMERIC AS defect_rew
    FROM towers t
    CROSS JOIN day_count dc
    LEFT JOIN production pr ON pr.tower_no = t.tower_no
    LEFT JOIN shift_plan sp ON sp.tower_no = t.tower_no
    LEFT JOIN pt_defects ptd ON ptd.tower_no = t.tower_no
    LEFT JOIN qc_defects qcd ON qcd.tower_no = t.tower_no
),
 
final AS (
    SELECT
        c.tower_no::VARCHAR AS machine,
        c.rated_speed,
        c.total_time,
        c.production,
        c.planned_timeloss,
        c.planned_prod_time,
        c.downtime,
        c.operating_time,
        (c.defect_pt + c.defect_drrej + c.defect_fail + c.defect_rew) AS defect_kms,
        c.defect_pt,
        c.defect_drrej,
        c.defect_fail,
        c.defect_rew
    FROM combined c
)
 
SELECT
    f.machine,
    f.rated_speed,
    f.total_time,
    ROUND(f.production, 2)                                    AS production,
    f.planned_timeloss,
    f.planned_prod_time,
    f.downtime,
    f.operating_time,
    ROUND(f.operating_time / NULLIF(f.planned_prod_time, 0) * 100, 1)               AS availability,
    ROUND(f.production / NULLIF(f.rated_speed * f.operating_time, 0) * 100, 1)      AS performance,
    ROUND((f.production - f.defect_kms) / NULLIF(f.production, 0) * 100, 1)         AS quality,
    ROUND(
        (f.operating_time / NULLIF(f.planned_prod_time, 0) * 100)
      * (f.production / NULLIF(f.rated_speed * f.operating_time, 0) * 100)
      * ((f.production - f.defect_kms) / NULLIF(f.production, 0) * 100)
      / 10000, 1)                                                                   AS oee,
    ROUND(f.defect_kms, 1)                                    AS defect_kms,
    ROUND(f.defect_pt, 1)                                     AS defect_pt,
    ROUND(f.defect_drrej, 1)                                  AS defect_drrej,
    ROUND(f.defect_fail, 1)                                   AS defect_fail,
    ROUND(f.defect_rew, 1)                                    AS defect_rew
FROM final f
 
UNION ALL
 
SELECT
    'Total'                                                   AS machine,
    p_rated_speed                                             AS rated_speed,
    SUM(f.total_time)                                         AS total_time,
    ROUND(SUM(f.production), 2)                               AS production,
    SUM(f.planned_timeloss)                                   AS planned_timeloss,
    SUM(f.planned_prod_time)                                  AS planned_prod_time,
    SUM(f.downtime)                                           AS downtime,
    SUM(f.operating_time)                                     AS operating_time,
    ROUND(SUM(f.operating_time) / NULLIF(SUM(f.planned_prod_time), 0) * 100, 1)     AS availability,
    ROUND(SUM(f.production) / NULLIF(p_rated_speed * SUM(f.operating_time), 0) * 100, 1) AS performance,
    ROUND((SUM(f.production) - SUM(f.defect_kms)) / NULLIF(SUM(f.production), 0) * 100, 1) AS quality,
    ROUND(
        (SUM(f.operating_time) / NULLIF(SUM(f.planned_prod_time), 0) * 100)
      * (SUM(f.production) / NULLIF(p_rated_speed * SUM(f.operating_time), 0) * 100)
      * ((SUM(f.production) - SUM(f.defect_kms)) / NULLIF(SUM(f.production), 0) * 100)
      / 10000, 1)                                                                   AS oee,
    ROUND(SUM(f.defect_kms), 1)                               AS defect_kms,
    ROUND(SUM(f.defect_pt), 1)                                AS defect_pt,
    ROUND(SUM(f.defect_drrej), 1)                             AS defect_drrej,
    ROUND(SUM(f.defect_fail), 1)                              AS defect_fail,
    ROUND(SUM(f.defect_rew), 1)                               AS defect_rew
FROM final f
 
ORDER BY 1;
 
$$;


ALTER FUNCTION public.fn_draw_tower_oee_report(p_start_date date, p_end_date date, p_rated_speed numeric) OWNER TO postgres;

--
-- Name: fn_draw_tower_optical_packing_report(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_tower_optical_packing_report(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(draw_tower character varying, ondate_optical_yield numeric, ondate_total_pack_km numeric, ondate_packing_yield numeric, cumm_optical_yield numeric, cumm_total_pack_km numeric, cumm_packing_yield numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start
),
 
towers AS (
    SELECT DISTINCT pe.tower_no AS tower_no
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
),
 
-- ---------- OPTICAL (QC) ----------
ondate_optical AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(qe.optical_length), 0)::NUMERIC AS total_optical,
        COALESCE(SUM(qe.optical_length) FILTER (
            WHERE qe.final_grade IS NOT NULL
              AND TRIM(qe.final_grade) <> ''
              AND qe.final_grade NOT IN ('REW', 'Fail')
        ), 0)::NUMERIC AS good_optical
    FROM public.qc_entry qe
    JOIN public.pt_entry pe ON pe.bobbin_no = qe.bobbin_no
    , params p
    WHERE pe.pt_entry = p.ondate
    GROUP BY pe.tower_no
),
 
cumm_optical AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(qe.optical_length), 0)::NUMERIC AS total_optical,
        COALESCE(SUM(qe.optical_length) FILTER (
            WHERE qe.final_grade IS NOT NULL
              AND TRIM(qe.final_grade) <> ''
              AND qe.final_grade NOT IN ('REW', 'Fail')
        ), 0)::NUMERIC AS good_optical
    FROM public.qc_entry qe
    JOIN public.pt_entry pe ON pe.bobbin_no = qe.bobbin_no
    , params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
    GROUP BY pe.tower_no
),
 
-- ---------- PACKING ----------
ondate_pack AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pob.length_km), 0)::NUMERIC AS total_pack_km
    FROM public.packing_order_bobbin pob
    JOIN public.packing_order po ON po.order_no = pob.packing_order
    JOIN public.pt_entry pe ON pe.bobbin_no = pob.bobbin_no
    , params p
    WHERE po.created_at::date = p.ondate
    GROUP BY pe.tower_no
),
 
cumm_pack AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pob.length_km), 0)::NUMERIC AS total_pack_km
    FROM public.packing_order_bobbin pob
    JOIN public.packing_order po ON po.order_no = pob.packing_order
    JOIN public.pt_entry pe ON pe.bobbin_no = pob.bobbin_no
    , params p
    WHERE po.created_at::date BETWEEN p.cumm_start AND p.ondate
    GROUP BY pe.tower_no
),
 
-- ---------- DRAW (denominator for Packing Yield) ----------
ondate_draw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km
    FROM public.draw_entry de, params p
    WHERE de.start_date = p.ondate
    GROUP BY de.tower_no
),
 
cumm_draw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km
    FROM public.draw_entry de, params p
    WHERE de.start_date BETWEEN p.cumm_start AND p.ondate
    GROUP BY de.tower_no
),
 
combined AS (
    SELECT
        t.tower_no,
        COALESCE(oo.total_optical, 0)::NUMERIC AS ondate_total_optical,
        COALESCE(oo.good_optical, 0)::NUMERIC AS ondate_good_optical,
        COALESCE(co.total_optical, 0)::NUMERIC AS cumm_total_optical,
        COALESCE(co.good_optical, 0)::NUMERIC AS cumm_good_optical,
        COALESCE(op.total_pack_km, 0)::NUMERIC AS ondate_total_pack_km,
        COALESCE(cp.total_pack_km, 0)::NUMERIC AS cumm_total_pack_km,
        COALESCE(od.drawn_km, 0)::NUMERIC AS ondate_drawn_km,
        COALESCE(cd.drawn_km, 0)::NUMERIC AS cumm_drawn_km
    FROM towers t
    LEFT JOIN ondate_optical oo ON oo.tower_no = t.tower_no
    LEFT JOIN cumm_optical co   ON co.tower_no = t.tower_no
    LEFT JOIN ondate_pack op    ON op.tower_no = t.tower_no
    LEFT JOIN cumm_pack cp      ON cp.tower_no = t.tower_no
    LEFT JOIN ondate_draw od    ON od.tower_no = t.tower_no
    LEFT JOIN cumm_draw cd      ON cd.tower_no = t.tower_no
),
 
final AS (
    SELECT
        'DRAW TOWER ' || c.tower_no::VARCHAR AS draw_tower,
        c.tower_no,
        c.ondate_total_optical,
        c.ondate_good_optical,
        c.cumm_total_optical,
        c.cumm_good_optical,
        c.ondate_total_pack_km,
        c.cumm_total_pack_km,
        c.ondate_drawn_km,
        c.cumm_drawn_km
    FROM combined c
),
 
unioned AS (
    SELECT
        f.tower_no AS sort_key,
        f.draw_tower,
        ROUND(f.ondate_good_optical / NULLIF(f.ondate_total_optical, 0) * 100, 1) AS ondate_optical_yield,
        ROUND(f.ondate_total_pack_km, 1)                                          AS ondate_total_pack_km,
        ROUND(f.ondate_total_pack_km / NULLIF(f.ondate_drawn_km, 0) * 100, 1)      AS ondate_packing_yield,
        ROUND(f.cumm_good_optical / NULLIF(f.cumm_total_optical, 0) * 100, 1)     AS cumm_optical_yield,
        ROUND(f.cumm_total_pack_km, 1)                                            AS cumm_total_pack_km,
        ROUND(f.cumm_total_pack_km / NULLIF(f.cumm_drawn_km, 0) * 100, 1)          AS cumm_packing_yield
    FROM final f
 
    UNION ALL
 
    SELECT
        999 AS sort_key,
        'TOTAL',
        ROUND(SUM(f.ondate_good_optical) / NULLIF(SUM(f.ondate_total_optical), 0) * 100, 1),
        ROUND(SUM(f.ondate_total_pack_km), 1),
        ROUND(SUM(f.ondate_total_pack_km) / NULLIF(SUM(f.ondate_drawn_km), 0) * 100, 1),
        ROUND(SUM(f.cumm_good_optical) / NULLIF(SUM(f.cumm_total_optical), 0) * 100, 1),
        ROUND(SUM(f.cumm_total_pack_km), 1),
        ROUND(SUM(f.cumm_total_pack_km) / NULLIF(SUM(f.cumm_drawn_km), 0) * 100, 1)
    FROM final f
)
 
SELECT
    u.draw_tower,
    u.ondate_optical_yield,
    u.ondate_total_pack_km,
    u.ondate_packing_yield,
    u.cumm_optical_yield,
    u.cumm_total_pack_km,
    u.cumm_packing_yield
FROM unioned u
ORDER BY u.sort_key;
 
$$;


ALTER FUNCTION public.fn_draw_tower_optical_packing_report(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_draw_tower_pt_proof_report(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_tower_pt_proof_report(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(draw_tower character varying, ondate_total_pt numeric, ondate_pt_yield numeric, ondate_pt_50_4 numeric, ondate_pt_brks_num numeric, cumm_total_pt numeric, cumm_pt_yield numeric, cumm_pt_50_4 numeric, cumm_pt_brks_num numeric, ondate_drwn_km_theo_km numeric, cumm_drwn_km_theo_km numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start
),
 
towers AS (
    SELECT DISTINCT pe.tower_no AS tower_no
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
),
 
-- ---------- ONDATE PT ----------
ondate_pt AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NOT NULL), 0)::NUMERIC AS good_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NOT NULL AND pe.pt_length >= 50.4), 0)::NUMERIC AS pt_50_4,
        COUNT(*) FILTER (WHERE pe.is_break = TRUE AND pe.fid IS NOT NULL)::NUMERIC AS brk_num
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry = p.ondate
    GROUP BY pe.tower_no
),
 
-- ---------- CUMULATIVE PT ----------
cumm_pt AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NOT NULL), 0)::NUMERIC AS good_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NOT NULL AND pe.pt_length >= 50.4), 0)::NUMERIC AS pt_50_4,
        COUNT(*) FILTER (WHERE pe.is_break = TRUE AND pe.fid IS NOT NULL)::NUMERIC AS brk_num
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
    GROUP BY pe.tower_no
),
 
-- ---------- DRAWN vs THEORETICAL (unconfirmed formula, see header note) ----------
ondate_draw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km
    FROM public.draw_entry de, params p
    WHERE de.start_date = p.ondate
    GROUP BY de.tower_no
),
 
ondate_theo AS (
    SELECT
        dsp.tower_no,
        COALESCE(SUM(dsp.draw_plan), 0)::NUMERIC AS theo_km
    FROM public.draw_shift_plan dsp, params p
    WHERE dsp.plan_date = p.ondate
    GROUP BY dsp.tower_no
),
 
cumm_draw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km
    FROM public.draw_entry de, params p
    WHERE de.start_date BETWEEN p.cumm_start AND p.ondate
    GROUP BY de.tower_no
),
 
cumm_theo AS (
    SELECT
        dsp.tower_no,
        COALESCE(SUM(dsp.draw_plan), 0)::NUMERIC AS theo_km
    FROM public.draw_shift_plan dsp, params p
    WHERE dsp.plan_date BETWEEN p.cumm_start AND p.ondate
    GROUP BY dsp.tower_no
),
 
combined AS (
    SELECT
        t.tower_no,
        COALESCE(op.total_pt, 0)::NUMERIC AS ondate_total_pt,
        COALESCE(op.good_pt, 0)::NUMERIC AS ondate_good_pt,
        COALESCE(op.pt_50_4, 0)::NUMERIC AS ondate_pt_50_4,
        COALESCE(op.brk_num, 0)::NUMERIC AS ondate_brk_num,
        COALESCE(cp.total_pt, 0)::NUMERIC AS cumm_total_pt,
        COALESCE(cp.good_pt, 0)::NUMERIC AS cumm_good_pt,
        COALESCE(cp.pt_50_4, 0)::NUMERIC AS cumm_pt_50_4,
        COALESCE(cp.brk_num, 0)::NUMERIC AS cumm_brk_num,
        COALESCE(od.drawn_km, 0)::NUMERIC AS ondate_drawn_km,
        COALESCE(ot.theo_km, 0)::NUMERIC AS ondate_theo_km,
        COALESCE(cd.drawn_km, 0)::NUMERIC AS cumm_drawn_km,
        COALESCE(ct.theo_km, 0)::NUMERIC AS cumm_theo_km
    FROM towers t
    LEFT JOIN ondate_pt op   ON op.tower_no = t.tower_no
    LEFT JOIN cumm_pt cp     ON cp.tower_no = t.tower_no
    LEFT JOIN ondate_draw od ON od.tower_no = t.tower_no
    LEFT JOIN ondate_theo ot ON ot.tower_no = t.tower_no
    LEFT JOIN cumm_draw cd   ON cd.tower_no = t.tower_no
    LEFT JOIN cumm_theo ct   ON ct.tower_no = t.tower_no
),
 
final AS (
    SELECT
        'DRAW TOWER ' || c.tower_no::VARCHAR AS draw_tower,
        c.tower_no,
        c.ondate_total_pt,
        c.ondate_good_pt,
        c.ondate_pt_50_4,
        c.ondate_brk_num,
        c.cumm_total_pt,
        c.cumm_good_pt,
        c.cumm_pt_50_4,
        c.cumm_brk_num,
        c.ondate_drawn_km,
        c.ondate_theo_km,
        c.cumm_drawn_km,
        c.cumm_theo_km
    FROM combined c
),
 
unioned AS (
    SELECT
        f.tower_no AS sort_key,
        f.draw_tower,
        ROUND(f.ondate_total_pt, 1)                                                        AS ondate_total_pt,
        ROUND(f.ondate_good_pt / NULLIF(f.ondate_total_pt, 0) * 100, 1)                     AS ondate_pt_yield,
        ROUND(f.ondate_pt_50_4 / NULLIF(f.ondate_total_pt, 0) * 100, 1)                     AS ondate_pt_50_4,
        f.ondate_brk_num                                                                    AS ondate_pt_brks_num,
        ROUND(f.cumm_total_pt, 1)                                                           AS cumm_total_pt,
        ROUND(f.cumm_good_pt / NULLIF(f.cumm_total_pt, 0) * 100, 1)                         AS cumm_pt_yield,
        ROUND(f.cumm_pt_50_4 / NULLIF(f.cumm_total_pt, 0) * 100, 1)                         AS cumm_pt_50_4,
        f.cumm_brk_num                                                                      AS cumm_pt_brks_num,
        ROUND(f.ondate_drawn_km / NULLIF(f.ondate_theo_km, 0) * 100, 1)                     AS ondate_drwn_km_theo_km,
        ROUND(f.cumm_drawn_km / NULLIF(f.cumm_theo_km, 0) * 100, 1)                         AS cumm_drwn_km_theo_km
    FROM final f
 
    UNION ALL
 
    SELECT
        999                                                                                  AS sort_key,
        'TOTAL',
        ROUND(SUM(f.ondate_total_pt), 1),
        ROUND(SUM(f.ondate_good_pt) / NULLIF(SUM(f.ondate_total_pt), 0) * 100, 1),
        ROUND(SUM(f.ondate_pt_50_4) / NULLIF(SUM(f.ondate_total_pt), 0) * 100, 1),
        SUM(f.ondate_brk_num),
        ROUND(SUM(f.cumm_total_pt), 1),
        ROUND(SUM(f.cumm_good_pt) / NULLIF(SUM(f.cumm_total_pt), 0) * 100, 1),
        ROUND(SUM(f.cumm_pt_50_4) / NULLIF(SUM(f.cumm_total_pt), 0) * 100, 1),
        SUM(f.cumm_brk_num),
        ROUND(SUM(f.ondate_drawn_km) / NULLIF(SUM(f.ondate_theo_km), 0) * 100, 1),
        ROUND(SUM(f.cumm_drawn_km) / NULLIF(SUM(f.cumm_theo_km), 0) * 100, 1)
    FROM final f
)
 
SELECT
    u.draw_tower,
    u.ondate_total_pt,
    u.ondate_pt_yield,
    u.ondate_pt_50_4,
    u.ondate_pt_brks_num,
    u.cumm_total_pt,
    u.cumm_pt_yield,
    u.cumm_pt_50_4,
    u.cumm_pt_brks_num,
    u.ondate_drwn_km_theo_km,
    u.cumm_drwn_km_theo_km
FROM unioned u
ORDER BY u.sort_key;
 
$$;


ALTER FUNCTION public.fn_draw_tower_pt_proof_report(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_draw_tower_yield_report(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_tower_yield_report(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(draw_tower character varying, ondate_drawn_km numeric, ondate_draw_brk_num numeric, ondate_draw_yield numeric, ondate_dr_brks_10000 numeric, cumm_drawn_km numeric, cumm_draw_brk_num numeric, cumm_draw_yield numeric, cumm_dr_brks_10000 numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start
),
 
towers AS (
    SELECT DISTINCT de.tower_no::INTEGER AS tower_no
    FROM public.draw_entry de, params p
    WHERE de.start_date BETWEEN p.cumm_start AND p.ondate
),
 
-- ---------- ONDATE ----------
ondate_draw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km,
        COUNT(*) FILTER (WHERE de.indication_fiber_cut = 'Draw Break')::NUMERIC AS brk_num
    FROM public.draw_entry de, params p
    WHERE de.start_date = p.ondate
    GROUP BY de.tower_no
),
 
ondate_flaw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(dfd.actual_cutting), 0)::NUMERIC AS flaw_cutting
    FROM public.draw_entry de
    JOIN public.draw_flaw_details dfd ON dfd.spool_id = de.spool_id
    , params p
    WHERE de.start_date = p.ondate
    GROUP BY de.tower_no
),
 
-- ---------- CUMULATIVE ----------
cumm_draw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km,
        COUNT(*) FILTER (WHERE de.indication_fiber_cut = 'Draw Break')::NUMERIC AS brk_num
    FROM public.draw_entry de, params p
    WHERE de.start_date BETWEEN p.cumm_start AND p.ondate
    GROUP BY de.tower_no
),
 
cumm_flaw AS (
    SELECT
        de.tower_no::INTEGER AS tower_no,
        COALESCE(SUM(dfd.actual_cutting), 0)::NUMERIC AS flaw_cutting
    FROM public.draw_entry de
    JOIN public.draw_flaw_details dfd ON dfd.spool_id = de.spool_id
    , params p
    WHERE de.start_date BETWEEN p.cumm_start AND p.ondate
    GROUP BY de.tower_no
),
 
combined AS (
    SELECT
        t.tower_no,
        COALESCE(od.drawn_km, 0)::NUMERIC AS ondate_drawn_km,
        COALESCE(od.brk_num, 0)::NUMERIC AS ondate_draw_brk_num,
        COALESCE(ofl.flaw_cutting, 0)::NUMERIC AS ondate_flaw_cutting,
        COALESCE(cd.drawn_km, 0)::NUMERIC AS cumm_drawn_km,
        COALESCE(cd.brk_num, 0)::NUMERIC AS cumm_draw_brk_num,
        COALESCE(cfl.flaw_cutting, 0)::NUMERIC AS cumm_flaw_cutting
    FROM towers t
    LEFT JOIN ondate_draw od  ON od.tower_no = t.tower_no
    LEFT JOIN ondate_flaw ofl ON ofl.tower_no = t.tower_no
    LEFT JOIN cumm_draw cd    ON cd.tower_no = t.tower_no
    LEFT JOIN cumm_flaw cfl   ON cfl.tower_no = t.tower_no
),
 
final AS (
    SELECT
        'DRAW TOWER ' || c.tower_no::VARCHAR AS draw_tower,
        c.ondate_drawn_km,
        c.ondate_draw_brk_num,
        c.ondate_flaw_cutting,
        c.cumm_drawn_km,
        c.cumm_draw_brk_num,
        c.cumm_flaw_cutting,
        c.tower_no
    FROM combined c
),
 
unioned AS (
    SELECT
        f.tower_no AS sort_key,
        f.draw_tower,
        ROUND(f.ondate_drawn_km, 1)                                                              AS ondate_drawn_km,
        ROUND(f.ondate_draw_brk_num, 1)                                                          AS ondate_draw_brk_num,
        ROUND((f.ondate_drawn_km - f.ondate_flaw_cutting) / NULLIF(f.ondate_drawn_km, 0) * 100, 1) AS ondate_draw_yield,
        ROUND(f.ondate_draw_brk_num * 10000 / NULLIF(f.ondate_drawn_km, 0), 1)                    AS ondate_dr_brks_10000,
        ROUND(f.cumm_drawn_km, 1)                                                                 AS cumm_drawn_km,
        ROUND(f.cumm_draw_brk_num, 1)                                                             AS cumm_draw_brk_num,
        ROUND((f.cumm_drawn_km - f.cumm_flaw_cutting) / NULLIF(f.cumm_drawn_km, 0) * 100, 1)       AS cumm_draw_yield,
        ROUND(f.cumm_draw_brk_num * 10000 / NULLIF(f.cumm_drawn_km, 0), 1)                        AS cumm_dr_brks_10000
    FROM final f
 
    UNION ALL
 
    SELECT
        999                                                                                        AS sort_key,
        'TOTAL',
        ROUND(SUM(f.ondate_drawn_km), 1),
        ROUND(SUM(f.ondate_draw_brk_num), 1),
        ROUND((SUM(f.ondate_drawn_km) - SUM(f.ondate_flaw_cutting)) / NULLIF(SUM(f.ondate_drawn_km), 0) * 100, 1),
        ROUND(SUM(f.ondate_draw_brk_num) * 10000 / NULLIF(SUM(f.ondate_drawn_km), 0), 1),
        ROUND(SUM(f.cumm_drawn_km), 1),
        ROUND(SUM(f.cumm_draw_brk_num), 1),
        ROUND((SUM(f.cumm_drawn_km) - SUM(f.cumm_flaw_cutting)) / NULLIF(SUM(f.cumm_drawn_km), 0) * 100, 1),
        ROUND(SUM(f.cumm_draw_brk_num) * 10000 / NULLIF(SUM(f.cumm_drawn_km), 0), 1)
    FROM final f
)
 
SELECT
    u.draw_tower,
    u.ondate_drawn_km,
    u.ondate_draw_brk_num,
    u.ondate_draw_yield,
    u.ondate_dr_brks_10000,
    u.cumm_drawn_km,
    u.cumm_draw_brk_num,
    u.cumm_draw_yield,
    u.cumm_dr_brks_10000
FROM unioned u
ORDER BY u.sort_key;
 
$$;


ALTER FUNCTION public.fn_draw_tower_yield_report(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_draw_wise_defect(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_draw_wise_defect(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(draw_tower character varying, ondate_bfd_1000 numeric, ondate_lumps_1000 numeric, ondate_airline_1000 numeric, ondate_nd_value numeric, cumm_bfd_1000 numeric, cumm_lumps_1000 numeric, cumm_airline_1000 numeric, cumm_nd_value numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start
),
 
towers AS (
    SELECT DISTINCT pe.tower_no AS tower_no
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
),
 
ondate_pt AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NOT NULL), 0)::NUMERIC AS good_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'B-BFD'), 0)::NUMERIC AS bfd_len,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'L-Lumps'), 0)::NUMERIC AS lumps_len,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'Airline'), 0)::NUMERIC AS airline_len
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry = p.ondate
    GROUP BY pe.tower_no
),
 
cumm_pt AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NOT NULL), 0)::NUMERIC AS good_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'B-BFD'), 0)::NUMERIC AS bfd_len,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'L-Lumps'), 0)::NUMERIC AS lumps_len,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.rejection_reason = 'Airline'), 0)::NUMERIC AS airline_len
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
    GROUP BY pe.tower_no
),
 
combined AS (
    SELECT
        t.tower_no,
        COALESCE(op.good_pt, 0)::NUMERIC AS ondate_good_pt,
        COALESCE(op.bfd_len, 0)::NUMERIC AS ondate_bfd_len,
        COALESCE(op.lumps_len, 0)::NUMERIC AS ondate_lumps_len,
        COALESCE(op.airline_len, 0)::NUMERIC AS ondate_airline_len,
        COALESCE(cp.good_pt, 0)::NUMERIC AS cumm_good_pt,
        COALESCE(cp.bfd_len, 0)::NUMERIC AS cumm_bfd_len,
        COALESCE(cp.lumps_len, 0)::NUMERIC AS cumm_lumps_len,
        COALESCE(cp.airline_len, 0)::NUMERIC AS cumm_airline_len
    FROM towers t
    LEFT JOIN ondate_pt op ON op.tower_no = t.tower_no
    LEFT JOIN cumm_pt cp   ON cp.tower_no = t.tower_no
),
 
final AS (
    SELECT
        'DRAW TOWER ' || c.tower_no::VARCHAR AS draw_tower,
        c.tower_no,
        c.ondate_good_pt,
        c.ondate_bfd_len,
        c.ondate_lumps_len,
        c.ondate_airline_len,
        c.cumm_good_pt,
        c.cumm_bfd_len,
        c.cumm_lumps_len,
        c.cumm_airline_len
    FROM combined c
),
 
unioned AS (
    SELECT
        f.tower_no AS sort_key,
        f.draw_tower,
        ROUND(f.ondate_bfd_len * 1000 / NULLIF(f.ondate_good_pt, 0), 1)     AS ondate_bfd_1000,
        ROUND(f.ondate_lumps_len * 1000 / NULLIF(f.ondate_good_pt, 0), 1)  AS ondate_lumps_1000,
        ROUND(f.ondate_airline_len * 1000 / NULLIF(f.ondate_good_pt, 0), 2) AS ondate_airline_1000,
        0.000::NUMERIC                                                     AS ondate_nd_value,
        ROUND(f.cumm_bfd_len * 1000 / NULLIF(f.cumm_good_pt, 0), 1)        AS cumm_bfd_1000,
        ROUND(f.cumm_lumps_len * 1000 / NULLIF(f.cumm_good_pt, 0), 1)      AS cumm_lumps_1000,
        ROUND(f.cumm_airline_len * 1000 / NULLIF(f.cumm_good_pt, 0), 2)    AS cumm_airline_1000,
        0.000::NUMERIC                                                     AS cumm_nd_value
    FROM final f
 
    UNION ALL
 
    SELECT
        999 AS sort_key,
        'TOTAL',
        ROUND(SUM(f.ondate_bfd_len) * 1000 / NULLIF(SUM(f.ondate_good_pt), 0), 1),
        ROUND(SUM(f.ondate_lumps_len) * 1000 / NULLIF(SUM(f.ondate_good_pt), 0), 1),
        ROUND(SUM(f.ondate_airline_len) * 1000 / NULLIF(SUM(f.ondate_good_pt), 0), 2),
        0.000::NUMERIC,
        ROUND(SUM(f.cumm_bfd_len) * 1000 / NULLIF(SUM(f.cumm_good_pt), 0), 1),
        ROUND(SUM(f.cumm_lumps_len) * 1000 / NULLIF(SUM(f.cumm_good_pt), 0), 1),
        ROUND(SUM(f.cumm_airline_len) * 1000 / NULLIF(SUM(f.cumm_good_pt), 0), 2),
        0.000::NUMERIC
    FROM final f
)
 
SELECT
    u.draw_tower,
    u.ondate_bfd_1000,
    u.ondate_lumps_1000,
    u.ondate_airline_1000,
    u.ondate_nd_value,
    u.cumm_bfd_1000,
    u.cumm_lumps_1000,
    u.cumm_airline_1000,
    u.cumm_nd_value
FROM unioned u
ORDER BY u.sort_key;
 
$$;


ALTER FUNCTION public.fn_draw_wise_defect(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_dynamic_shift_report(date, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_dynamic_shift_report(p_date date DEFAULT CURRENT_DATE, p_shift character varying DEFAULT NULL::character varying, p_report_type character varying DEFAULT 'PT'::character varying) RETURNS TABLE(report_type character varying, machine character varying, total_pt numeric, pt_ok numeric, pt_scrap numeric, draw_rejection numeric, multiple_end_scrap numeric, scratches numeric, sample_scrap numeric, pt_break bigint, total_drawn_length numeric, top_end_scrap numeric, bottom_end_scrap numeric, flaw_count bigint, flaw_length numeric)
    LANGUAGE sql STABLE
    AS $$

WITH shift_data AS (
    SELECT
        pe.pt_machine,
        pe.pt_length,
        pe.fid,
        pe.rejection,
        pe.multiple_end,
        pe.scratch,
        pe.ztmd,
        pe.doc,
        pe.is_break,

        CASE
            WHEN pe.created_at::time >= TIME '07:00:00'
             AND pe.created_at::time <  TIME '15:00:00' THEN 'A'
            WHEN pe.created_at::time >= TIME '15:00:00'
             AND pe.created_at::time <  TIME '23:00:00' THEN 'B'
            ELSE 'C'
        END AS shift_code,

        CASE
            WHEN pe.created_at::time < TIME '07:00:00'
                THEN (pe.created_at::date - INTERVAL '1 day')::date
            ELSE pe.created_at::date
        END AS shift_date

    FROM public.pt_entry pe
),

filtered_pt AS (
    SELECT *
    FROM shift_data
    WHERE shift_date = p_date
      AND (p_shift IS NULL OR shift_code = UPPER(p_shift))
),

/* =============================================================
   DRAW DATA
   Grouped by tower_no. Filters on start_date + shift directly
   (draw_entry stores shift as an explicit column, unlike PT).
   ============================================================= */
draw_flaw AS (
    SELECT
        dfd.spool_id,
        COUNT(*) AS flaw_count,
        COALESCE(SUM(dfd.defect_length), 0)::NUMERIC AS flaw_length
    FROM public.draw_flaw_details dfd
    GROUP BY dfd.spool_id
),

filtered_draw AS (
    SELECT
        de.tower_no,
        de.spool_id,
        de.drawn_length,
        de.top_end_scrap,
        de.bottom_end_scrap
    FROM public.draw_entry de
    WHERE de.start_date = p_date
      AND (p_shift IS NULL OR de.shift = UPPER(p_shift))
),

draw_joined AS (
    SELECT
        fd.tower_no,
        fd.drawn_length,
        fd.top_end_scrap,
        fd.bottom_end_scrap,
        COALESCE(df.flaw_count, 0)::BIGINT AS flaw_count,
        COALESCE(df.flaw_length, 0)::NUMERIC AS flaw_length
    FROM filtered_draw fd
    LEFT JOIN draw_flaw df
        ON df.spool_id = fd.spool_id
)

/* =============================================================
   PT REPORT (machine-wise)
   ============================================================= */
SELECT
    'PT'::VARCHAR AS report_type,
    'PT Machine' || f.pt_machine::text AS machine,

    COALESCE(SUM(f.pt_length), 0)::NUMERIC AS total_pt,

    COALESCE(
        SUM(CASE WHEN f.fid IS NOT NULL THEN f.pt_length ELSE 0 END),
        0
    )::NUMERIC AS pt_ok,

    COALESCE(
        SUM(CASE WHEN f.fid IS NULL THEN f.pt_length ELSE 0 END),
        0
    )::NUMERIC AS pt_scrap,

    COALESCE(
        SUM(CASE WHEN f.fid IS NULL AND f.rejection = TRUE THEN f.pt_length ELSE 0 END),
        0
    )::NUMERIC AS draw_rejection,

    COALESCE(
        SUM(CASE WHEN f.fid IS NULL AND f.multiple_end = TRUE THEN f.pt_length ELSE 0 END),
        0
    )::NUMERIC AS multiple_end_scrap,

    COALESCE(
        SUM(CASE WHEN f.fid IS NULL AND f.scratch = TRUE THEN f.pt_length ELSE 0 END),
        0
    )::NUMERIC AS scratches,

    COALESCE(
        SUM(CASE WHEN f.fid IS NULL AND (f.ztmd = TRUE OR f.doc = TRUE) THEN f.pt_length ELSE 0 END),
        0
    )::NUMERIC AS sample_scrap,

    COUNT(*) FILTER (WHERE f.is_break = TRUE)::BIGINT AS pt_break,

    NULL::NUMERIC AS total_drawn_length,
    NULL::NUMERIC AS top_end_scrap,
    NULL::NUMERIC AS bottom_end_scrap,
    NULL::BIGINT AS flaw_count,
    NULL::NUMERIC AS flaw_length

FROM filtered_pt f
WHERE UPPER(p_report_type) = 'PT'
GROUP BY f.pt_machine

UNION ALL

/* =============================================================
   DRAW REPORT (tower-wise)
   ============================================================= */
SELECT
    'DRAW'::VARCHAR AS report_type,
    'Draw Tower' || dj.tower_no::text AS machine,

    NULL::NUMERIC AS total_pt,
    NULL::NUMERIC AS pt_ok,
    NULL::NUMERIC AS pt_scrap,
    NULL::NUMERIC AS draw_rejection,
    NULL::NUMERIC AS multiple_end_scrap,
    NULL::NUMERIC AS scratches,
    NULL::NUMERIC AS sample_scrap,
    NULL::BIGINT AS pt_break,

    COALESCE(SUM(dj.drawn_length), 0)::NUMERIC AS total_drawn_length,
    COALESCE(SUM(dj.top_end_scrap), 0)::NUMERIC AS top_end_scrap,
    COALESCE(SUM(dj.bottom_end_scrap), 0)::NUMERIC AS bottom_end_scrap,
    COALESCE(SUM(dj.flaw_count), 0)::BIGINT AS flaw_count,
    COALESCE(SUM(dj.flaw_length), 0)::NUMERIC AS flaw_length

FROM draw_joined dj
WHERE UPPER(p_report_type) = 'DRAW'
GROUP BY dj.tower_no

ORDER BY report_type, machine;

$$;


ALTER FUNCTION public.fn_dynamic_shift_report(p_date date, p_shift character varying, p_report_type character varying) OWNER TO postgres;

--
-- Name: fn_fg_stock(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_fg_stock(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(category character varying, opening numeric, ondate numeric, cumulative numeric, closing numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start,
        (p_date - 1) AS cumm_end
),
 
natural_opening AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    WHERE UPPER(be.fiber_color) = 'NATURAL'
      AND be.dispatch_status = 'NO'
),
 
natural_closing AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    WHERE UPPER(be.fiber_color) = 'NATURAL'
      AND be.dispatch_status = 'YES'
),
 
natural_ondate AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    JOIN public.qc_out qo ON qo.bobbin_no = be.bobbin_no
    , params p
    WHERE UPPER(be.fiber_color) = 'NATURAL'
      AND be.dispatch_status = 'NO'
      AND qo.out_date = p.ondate
),
 
natural_cumm AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    JOIN public.qc_out qo ON qo.bobbin_no = be.bobbin_no
    , params p
    WHERE UPPER(be.fiber_color) = 'NATURAL'
      AND be.dispatch_status = 'NO'
      AND qo.out_date BETWEEN p.cumm_start AND p.cumm_end
),
 
colored_opening AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    WHERE COALESCE(UPPER(be.fiber_color), '') <> 'NATURAL'
      AND be.dispatch_status = 'NO'
),
 
colored_closing AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    WHERE COALESCE(UPPER(be.fiber_color), '') <> 'NATURAL'
      AND be.dispatch_status = 'YES'
),
 
colored_ondate AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    JOIN public.qc_out qo ON qo.bobbin_no = be.bobbin_no
    , params p
    WHERE COALESCE(UPPER(be.fiber_color), '') <> 'NATURAL'
      AND be.dispatch_status = 'NO'
      AND qo.out_date = p.ondate
),
 
colored_cumm AS (
    SELECT COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS val
    FROM public.bobbin_entries be
    JOIN public.qc_out qo ON qo.bobbin_no = be.bobbin_no
    , params p
    WHERE COALESCE(UPPER(be.fiber_color), '') <> 'NATURAL'
      AND be.dispatch_status = 'NO'
      AND qo.out_date BETWEEN p.cumm_start AND p.cumm_end
)
 
SELECT 'SMFG NATURAL PRODUCTION'::VARCHAR,
       ROUND(no_.val, 2), ROUND(nod.val, 2), ROUND(nc.val, 2), ROUND(ncl.val, 2)
FROM natural_opening no_, natural_ondate nod, natural_cumm nc, natural_closing ncl
 
UNION ALL
 
SELECT 'SMFG COLORED PRODUCTION'::VARCHAR,
       ROUND(co.val, 2), ROUND(cod.val, 2), ROUND(cc.val, 2), ROUND(ccl.val, 2)
FROM colored_opening co, colored_ondate cod, colored_cumm cc, colored_closing ccl
 
UNION ALL
 
SELECT 'TOTAL PRODUCTION'::VARCHAR,
       NULL::NUMERIC,
       ROUND(nod.val + cod.val, 2),
       ROUND(nc.val + cc.val, 2),
       NULL::NUMERIC
FROM natural_ondate nod, colored_ondate cod, natural_cumm nc, colored_cumm cc;
 
$$;


ALTER FUNCTION public.fn_fg_stock(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_machine_wise_break_data(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_machine_wise_break_data(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(draw_tower character varying, ondate_pt_brks_1000 numeric, cumm_pt_brks_1000 numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start
),
 
towers AS (
    SELECT DISTINCT pe.tower_no AS tower_no
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
),
 
ondate_pt AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COUNT(*) FILTER (WHERE pe.is_break = TRUE AND pe.fid IS NOT NULL)::NUMERIC AS brk_num
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry = p.ondate
    GROUP BY pe.tower_no
),
 
cumm_pt AS (
    SELECT
        pe.tower_no,
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COUNT(*) FILTER (WHERE pe.is_break = TRUE AND pe.fid IS NOT NULL)::NUMERIC AS brk_num
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
    GROUP BY pe.tower_no
),
 
combined AS (
    SELECT
        t.tower_no,
        COALESCE(op.total_pt, 0)::NUMERIC AS ondate_total_pt,
        COALESCE(op.brk_num, 0)::NUMERIC AS ondate_brk_num,
        COALESCE(cp.total_pt, 0)::NUMERIC AS cumm_total_pt,
        COALESCE(cp.brk_num, 0)::NUMERIC AS cumm_brk_num
    FROM towers t
    LEFT JOIN ondate_pt op ON op.tower_no = t.tower_no
    LEFT JOIN cumm_pt cp   ON cp.tower_no = t.tower_no
),
 
final AS (
    SELECT
        'DRAW TOWER ' || c.tower_no::VARCHAR AS draw_tower,
        c.tower_no,
        c.ondate_total_pt,
        c.ondate_brk_num,
        c.cumm_total_pt,
        c.cumm_brk_num
    FROM combined c
),
 
unioned AS (
    SELECT
        f.tower_no AS sort_key,
        f.draw_tower,
        ROUND(f.ondate_brk_num * 1000 / NULLIF(f.ondate_total_pt, 0), 1) AS ondate_pt_brks_1000,
        ROUND(f.cumm_brk_num * 1000 / NULLIF(f.cumm_total_pt, 0), 1)     AS cumm_pt_brks_1000
    FROM final f
 
    UNION ALL
 
    SELECT
        999 AS sort_key,
        'TOTAL',
        ROUND(SUM(f.ondate_brk_num) * 1000 / NULLIF(SUM(f.ondate_total_pt), 0), 1),
        ROUND(SUM(f.cumm_brk_num) * 1000 / NULLIF(SUM(f.cumm_total_pt), 0), 1)
    FROM final f
)
 
SELECT
    u.draw_tower,
    u.ondate_pt_brks_1000,
    u.cumm_pt_brks_1000
FROM unioned u
ORDER BY u.sort_key;
 
$$;


ALTER FUNCTION public.fn_machine_wise_break_data(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_production_stages(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_production_stages(p_date date DEFAULT CURRENT_DATE, p_cumm_start_date date DEFAULT NULL::date) RETURNS TABLE(production_stage character varying, unit character varying, volume_ondt numeric, yield_ondt numeric, volume_target numeric, volume_achieved numeric, planned_yield numeric, yield_achieved numeric, loss_pct numeric, wip_target numeric, wip numeric)
    LANGUAGE sql STABLE
    AS $$
 
WITH params AS (
    SELECT
        p_date AS ondate,
        COALESCE(p_cumm_start_date, date_trunc('month', p_date)::date) AS cumm_start,
        (p_date - 1) AS cumm_end
),
 
preform_ondate AS (
    SELECT COUNT(*)::NUMERIC AS cnt
    FROM public.preform_accept pa, params p
    WHERE pa.entry_date = p.ondate
),
 
preform_cumm AS (
    SELECT COUNT(*)::NUMERIC AS cnt
    FROM public.preform_accept pa, params p
    WHERE pa.entry_date BETWEEN p.cumm_start AND p.cumm_end
),
 
draw_ondate AS (
    SELECT COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km
    FROM public.draw_entry de, params p
    WHERE de.entry_date = p.ondate
),
 
draw_ondate_flaw AS (
    SELECT COALESCE(SUM(dfd.actual_cutting), 0)::NUMERIC AS flaw_cut
    FROM public.draw_entry de
    JOIN public.draw_flaw_details dfd ON dfd.spool_id = de.spool_id
    , params p
    WHERE de.entry_date = p.ondate
),
 
draw_cumm AS (
    SELECT COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS drawn_km
    FROM public.draw_entry de, params p
    WHERE de.entry_date BETWEEN p.cumm_start AND p.ondate
),
 
draw_cumm_flaw AS (
    SELECT COALESCE(SUM(dfd.actual_cutting), 0)::NUMERIC AS flaw_cut
    FROM public.draw_entry de
    JOIN public.draw_flaw_details dfd ON dfd.spool_id = de.spool_id
    , params p
    WHERE de.entry_date BETWEEN p.cumm_start AND p.ondate
),
 
pt_ondate AS (
    SELECT
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC AS scrap_pt
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry = p.ondate
),
 
pt_cumm AS (
    SELECT
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC AS scrap_pt
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
),
 
pt_full_ondate AS (
    SELECT
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC AS scrap_pt
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry = p.ondate
      AND pe.pt_length >= 25.2
),
 
pt_full_cumm AS (
    SELECT
        COALESCE(SUM(pe.pt_length), 0)::NUMERIC AS total_pt,
        COALESCE(SUM(pe.pt_length) FILTER (WHERE pe.fid IS NULL), 0)::NUMERIC AS scrap_pt
    FROM public.pt_entry pe, params p
    WHERE pe.pt_entry BETWEEN p.cumm_start AND p.ondate
      AND pe.pt_length >= 25.2
),
 
optical_ondate AS (
    SELECT
        COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS total_len,
        COALESCE(SUM(be.fiber_length) FILTER (WHERE UPPER(be.final_grade) = 'FAIL'), 0)::NUMERIC AS fail_len
    FROM public.bobbin_entries be, params p
    WHERE be.final_grade_date = p.ondate
),
 
optical_cumm AS (
    SELECT
        COALESCE(SUM(be.fiber_length), 0)::NUMERIC AS total_len,
        COALESCE(SUM(be.fiber_length) FILTER (WHERE UPPER(be.final_grade) = 'FAIL'), 0)::NUMERIC AS fail_len
    FROM public.bobbin_entries be, params p
    WHERE be.final_grade_date BETWEEN p.cumm_start AND p.ondate
),
 
packing_ondate AS (
    SELECT COALESCE(SUM(po_.required_km), 0)::NUMERIC AS packed_km
    FROM public.packing_order po_, params p
    WHERE po_.is_packed = TRUE
      AND po_.updated_at::date = p.ondate
)
 
SELECT
    'Preform (Warehouse)'::VARCHAR AS production_stage,
    'No'::VARCHAR                 AS unit,
    po.cnt                        AS volume_ondt,
    NULL::NUMERIC                 AS yield_ondt,
    NULL::NUMERIC                 AS volume_target,
    pc.cnt                        AS volume_achieved,
    NULL::NUMERIC                 AS planned_yield,
    NULL::NUMERIC                 AS yield_achieved,
    NULL::NUMERIC                 AS loss_pct,
    NULL::NUMERIC                 AS wip_target,
    NULL::NUMERIC                 AS wip
FROM preform_ondate po, preform_cumm pc
 
UNION ALL
 
SELECT
    'Draw'::VARCHAR,
    'FKm'::VARCHAR,
    ROUND(do_.drawn_km, 1),
    ROUND((do_.drawn_km - dof.flaw_cut) / NULLIF(do_.drawn_km, 0) * 100, 1),
    50000::NUMERIC,
    ROUND(dc.drawn_km, 1),
    98::NUMERIC,
    ROUND((dc.drawn_km - dcf.flaw_cut) / NULLIF(dc.drawn_km, 0) * 100, 1),
    ROUND(((dc.drawn_km - dcf.flaw_cut) / NULLIF(dc.drawn_km, 0) * 100) - 98, 1),
    NULL::NUMERIC,
    NULL::NUMERIC
FROM draw_ondate do_, draw_ondate_flaw dof, draw_cumm dc, draw_cumm_flaw dcf
 
UNION ALL
 
SELECT
    'Proof Testing'::VARCHAR,
    'FKm'::VARCHAR,
    ROUND(pto.total_pt, 1),
    ROUND((pto.total_pt - pto.scrap_pt) / NULLIF(pto.total_pt, 0) * 100, 1),
    500000::NUMERIC,
    ROUND(ptc.total_pt, 1),
    98::NUMERIC,
    ROUND((ptc.total_pt - ptc.scrap_pt) / NULLIF(ptc.total_pt, 0) * 100, 1),
    ROUND(((ptc.total_pt - ptc.scrap_pt) / NULLIF(ptc.total_pt, 0) * 100) - 98, 1),
    NULL::NUMERIC,
    NULL::NUMERIC
FROM pt_ondate pto, pt_cumm ptc
 
UNION ALL
 
SELECT
    'PT Full Length >=24.2/25.2'::VARCHAR,
    'FKm'::VARCHAR,
    ROUND(pfo.total_pt, 1),
    ROUND((pfo.total_pt - pfo.scrap_pt) / NULLIF(pfo.total_pt, 0) * 100, 1),
    NULL::NUMERIC,
    ROUND(pfc.total_pt, 1),
    98::NUMERIC,
    ROUND((pfc.total_pt - pfc.scrap_pt) / NULLIF(pfc.total_pt, 0) * 100, 1),
    ROUND(((pfc.total_pt - pfc.scrap_pt) / NULLIF(pfc.total_pt, 0) * 100) - 98, 1),
    NULL::NUMERIC,
    NULL::NUMERIC
FROM pt_full_ondate pfo, pt_full_cumm pfc
 
UNION ALL
 
SELECT
    'Optical Testing'::VARCHAR,
    'FKm'::VARCHAR,
    ROUND(oo.total_len, 1),
    ROUND((oo.total_len - oo.fail_len) / NULLIF(oo.total_len, 0) * 100, 1),
    500000::NUMERIC,
    ROUND(oc.total_len, 1),
    98::NUMERIC,
    ROUND((oc.total_len - oc.fail_len) / NULLIF(oc.total_len, 0) * 100, 1),
    ROUND(((oc.total_len - oc.fail_len) / NULLIF(oc.total_len, 0) * 100) - 98, 1),
    NULL::NUMERIC,
    NULL::NUMERIC
FROM optical_ondate oo, optical_cumm oc
 
UNION ALL
 
SELECT
    'Packing'::VARCHAR,
    'FKm'::VARCHAR,
    ROUND(pko.packed_km, 1),
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC
FROM packing_ondate pko;
 
$$;


ALTER FUNCTION public.fn_production_stages(p_date date, p_cumm_start_date date) OWNER TO postgres;

--
-- Name: fn_production_trend(date, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_production_trend(p_date date DEFAULT CURRENT_DATE, p_num_months integer DEFAULT 9) RETURNS TABLE(metric character varying, period_label character varying, period_start date, period_end date, value numeric)
    LANGUAGE sql STABLE
    AS $$
 
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
        to_char(date_trunc('month', p_date) - (n || ' months')::interval, 'Mon-YY') AS m_label
    FROM generate_series(1, p_num_months) AS n
),
 
draw_ondate AS (
    SELECT COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS val
    FROM public.draw_entry de, params p
    WHERE de.entry_date = p.ondate
),
 
draw_cumm AS (
    SELECT COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS val
    FROM public.draw_entry de, params p
    WHERE de.entry_date BETWEEN p.month_start AND p.cumm_end
),
 
draw_monthly AS (
    SELECT
        m.month_offset,
        m.m_start,
        m.m_end,
        m.m_label,
        COALESCE(SUM(de.drawn_length), 0)::NUMERIC AS val
    FROM months m
    LEFT JOIN public.draw_entry de
        ON de.entry_date BETWEEN m.m_start AND m.m_end
    GROUP BY m.month_offset, m.m_start, m.m_end, m.m_label
),
 
unioned AS (
    SELECT
        -2 AS sort_key,
        'Total Drawn Km'::VARCHAR AS metric,
        'Target'::VARCHAR AS period_label,
        NULL::DATE AS period_start,
        NULL::DATE AS period_end,
        NULL::NUMERIC AS value
 
    UNION ALL
 
    SELECT
        -1,
        'Total Drawn Km'::VARCHAR,
        'Ondate'::VARCHAR,
        p.ondate,
        p.ondate,
        ROUND(do_.val, 1)
    FROM draw_ondate do_, params p
 
    UNION ALL
 
    SELECT
        0,
        'Total Drawn Km'::VARCHAR,
        'Cumm'::VARCHAR,
        p.month_start,
        p.cumm_end,
        ROUND(dc.val, 1)
    FROM draw_cumm dc, params p
 
    UNION ALL
 
    SELECT
        dm.month_offset,
        'Total Drawn Km'::VARCHAR,
        dm.m_label,
        dm.m_start,
        dm.m_end,
        ROUND(dm.val, 1)
    FROM draw_monthly dm
)
 
SELECT
    u.metric,
    u.period_label,
    u.period_start,
    u.period_end,
    u.value
FROM unioned u
ORDER BY u.sort_key;
 
$$;


ALTER FUNCTION public.fn_production_trend(p_date date, p_num_months integer) OWNER TO postgres;

--
-- Name: fn_production_trend_summary(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_production_trend_summary(p_date date) RETURNS TABLE(metric_name character varying, target_val numeric, on_date_val numeric, cumm_val numeric, m1_label character varying, m1_val numeric, m2_label character varying, m2_val numeric, m3_label character varying, m3_val numeric, m4_label character varying, m4_val numeric, m5_label character varying, m5_val numeric, m6_label character varying, m6_val numeric)
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


ALTER FUNCTION public.fn_production_trend_summary(p_date date) OWNER TO postgres;

--
-- Name: get_draw_break_details(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_draw_break_details(p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS TABLE(draw_fid character varying, preform_id character varying, break_reason character varying, tower_no integer, length numeric, break_category character varying, break_remark character varying, main_break_type character varying, sub_reason character varying, bsa_done_by character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Fallback to current date if dates are not provided
    v_start_date := COALESCE(p_start_date, CURRENT_DATE);
    v_end_date := COALESCE(p_end_date, CURRENT_DATE);

    RETURN QUERY
    SELECT 
        de.spool_fid AS draw_fid,
        de.preform_id,
        dba.break_type AS break_reason,
        de.tower_no,
        dba.break_length AS length,
        dba.break_category,
        dba.break_remark,
        dba.main_break_type,
        dba.sub_reason,
        dba.bsa_done_by
    FROM 
        draw_entry de
    INNER JOIN 
        draw_break_analysis dba ON de.spool_fid = dba.fiber_id
    WHERE 
        de.entry_date BETWEEN v_start_date AND v_end_date;
END;
$$;


ALTER FUNCTION public.get_draw_break_details(p_start_date date, p_end_date date) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aat_ch_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aat_ch_entry (
    aat_ch_id integer NOT NULL,
    aat_entry_id integer,
    max_ch_nm_1310 numeric(10,3),
    max_ch_nm_1550 numeric(10,3),
    max_ch_nm_1625 numeric(10,3)
);


ALTER TABLE public.aat_ch_entry OWNER TO postgres;

--
-- Name: aat_ch_entry_aat_ch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aat_ch_entry_aat_ch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aat_ch_entry_aat_ch_id_seq OWNER TO postgres;

--
-- Name: aat_ch_entry_aat_ch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aat_ch_entry_aat_ch_id_seq OWNED BY public.aat_ch_entry.aat_ch_id;


--
-- Name: aat_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aat_day_entry (
    aat_day_entry_id integer NOT NULL,
    aat_entry_id integer,
    bobbin_no character varying(50),
    aat_date date,
    aat_day integer,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.aat_day_entry OWNER TO postgres;

--
-- Name: aat_day_entry_aat_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aat_day_entry_aat_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aat_day_entry_aat_day_entry_id_seq OWNER TO postgres;

--
-- Name: aat_day_entry_aat_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aat_day_entry_aat_day_entry_id_seq OWNED BY public.aat_day_entry.aat_day_entry_id;


--
-- Name: aat_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aat_entry (
    aat_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    title character varying(200),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    temp numeric(10,3),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.aat_entry OWNER TO postgres;

--
-- Name: aat_entry_aat_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aat_entry_aat_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aat_entry_aat_entry_id_seq OWNER TO postgres;

--
-- Name: aat_entry_aat_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aat_entry_aat_entry_id_seq OWNED BY public.aat_entry.aat_entry_id;


--
-- Name: app_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_config (
    id integer NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value character varying(255) NOT NULL,
    description text,
    updated_by character varying(100),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false
);


ALTER TABLE public.app_config OWNER TO postgres;

--
-- Name: app_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.app_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_config_id_seq OWNER TO postgres;

--
-- Name: app_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_config_id_seq OWNED BY public.app_config.id;


--
-- Name: bobbin_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bobbin_color (
    bobbin_color_id integer NOT NULL,
    bobbin_color_name character varying(20) NOT NULL,
    is_disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bobbin_color OWNER TO postgres;

--
-- Name: bobbin_color_bobbin_color_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bobbin_color_bobbin_color_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bobbin_color_bobbin_color_id_seq OWNER TO postgres;

--
-- Name: bobbin_color_bobbin_color_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bobbin_color_bobbin_color_id_seq OWNED BY public.bobbin_color.bobbin_color_id;


--
-- Name: bobbin_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bobbin_entries (
    fid_create_id integer NOT NULL,
    fid character varying(20) NOT NULL,
    spool_id character varying(10) NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    tower_no integer,
    pt_machine_no integer,
    fiber_length numeric(10,2) NOT NULL,
    drawn_date date NOT NULL,
    pt_date date NOT NULL,
    drawn_length numeric(10,2),
    operator character varying(50),
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_pv boolean DEFAULT false,
    preform_type character varying(50),
    product_type character varying(50) NOT NULL,
    spool_fid character varying(50),
    preform_id character varying(10) NOT NULL,
    fiber_type character varying(50),
    fiber_color character varying(50),
    d2_issue boolean DEFAULT false,
    is_d2 boolean DEFAULT false,
    is_h2 boolean DEFAULT false,
    h2_issue boolean DEFAULT false,
    d2_batch_id character varying(50),
    h2_batch_id character varying(50),
    temp_grade character varying(50),
    final_grade character varying(50),
    lock boolean DEFAULT false,
    is_qc_out boolean DEFAULT false,
    dispatch_status character varying(20) DEFAULT 'NO'::character varying,
    is_h2_after boolean DEFAULT false,
    pt_strain integer,
    preform_vendor_id integer,
    coating_type character varying(20),
    final_grade_date timestamp without time zone,
    dispatched_date timestamp without time zone,
    optical_length numeric(10,3),
    ud_grade character varying(10),
    CONSTRAINT bobbin_entries_dispatch_status_check CHECK (((dispatch_status)::text = ANY (ARRAY['NO'::text, 'YES'::text, 'COLOR'::text, 'REW'::text, 'PACKED'::text, 'FAIL'::text])))
);


ALTER TABLE public.bobbin_entries OWNER TO postgres;

--
-- Name: bobbin_entries_fid_create_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bobbin_entries_fid_create_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bobbin_entries_fid_create_id_seq OWNER TO postgres;

--
-- Name: bobbin_entries_fid_create_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bobbin_entries_fid_create_id_seq OWNED BY public.bobbin_entries.fid_create_id;


--
-- Name: bobbin_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bobbin_type (
    bobbin_type_id integer NOT NULL,
    bobbin_type_name character varying(20) NOT NULL,
    is_disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bobbin_type OWNER TO postgres;

--
-- Name: bobbin_type_bobbin_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bobbin_type_bobbin_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bobbin_type_bobbin_type_id_seq OWNER TO postgres;

--
-- Name: bobbin_type_bobbin_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bobbin_type_bobbin_type_id_seq OWNED BY public.bobbin_type.bobbin_type_id;


--
-- Name: bom_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom_master (
    bom_id integer NOT NULL,
    material_code character varying(50) NOT NULL,
    material_desc text,
    component_material_code character varying(50) NOT NULL,
    component_material_desc text,
    consume_qty_per_km numeric(10,3) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bom_master OWNER TO postgres;

--
-- Name: bom_master_bom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bom_master_bom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_master_bom_id_seq OWNER TO postgres;

--
-- Name: bom_master_bom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bom_master_bom_id_seq OWNED BY public.bom_master.bom_id;


--
-- Name: col_material_code; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.col_material_code (
    col_material_code_id integer NOT NULL,
    product character varying(255),
    color character varying(255),
    material_code character varying(255),
    is_active boolean DEFAULT true
);


ALTER TABLE public.col_material_code OWNER TO postgres;

--
-- Name: col_material_code_col_material_code_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.col_material_code_col_material_code_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.col_material_code_col_material_code_id_seq OWNER TO postgres;

--
-- Name: col_material_code_col_material_code_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.col_material_code_col_material_code_id_seq OWNED BY public.col_material_code.col_material_code_id;


--
-- Name: color_machine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.color_machine (
    color_machine_id integer NOT NULL,
    color_machine_no character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.color_machine OWNER TO postgres;

--
-- Name: color_machine_color_machine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.color_machine_color_machine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.color_machine_color_machine_id_seq OWNER TO postgres;

--
-- Name: color_machine_color_machine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.color_machine_color_machine_id_seq OWNED BY public.color_machine.color_machine_id;


--
-- Name: coloring_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coloring_entry (
    colouring_id integer NOT NULL,
    bobbin_no character varying(10) CONSTRAINT coloring_entry_spool_no_not_null NOT NULL,
    original_color character varying(30),
    current_color character varying(30),
    color_batch_code character varying(50),
    fiber_length numeric(10,3),
    fid character varying(50),
    machine_no integer,
    is_scrap boolean DEFAULT false,
    bobbin_type character varying(50),
    operator character varying(50),
    bobbin_color character varying(50),
    remark text,
    logged_in_user character varying(50) NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    die_change character varying(20),
    parent_bobbin_no character varying(10)
);


ALTER TABLE public.coloring_entry OWNER TO postgres;

--
-- Name: coloring_entry_colouring_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coloring_entry_colouring_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coloring_entry_colouring_id_seq OWNER TO postgres;

--
-- Name: coloring_entry_colouring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coloring_entry_colouring_id_seq OWNED BY public.coloring_entry.colouring_id;


--
-- Name: customer_complaint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_complaint (
    complaint_id character varying(50) NOT NULL,
    complaint_type character varying(50),
    customer_name character varying(100) NOT NULL,
    raised_by integer NOT NULL,
    complaint_date date,
    closed_date date,
    product_details text,
    po_no character varying(50),
    po_quantity numeric(10,3),
    reject_quantity numeric(10,3),
    shipment_date date,
    grn_no character varying(50),
    test_cert_no character varying(50),
    complaint_feedback text,
    complaint_status character varying(20) DEFAULT 'open'::character varying,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_complaint_complaint_status_check CHECK (((complaint_status)::text = ANY (ARRAY[('open'::character varying)::text, ('close'::character varying)::text])))
);


ALTER TABLE public.customer_complaint OWNER TO postgres;

--
-- Name: customer_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_table (
    customer_id integer NOT NULL,
    customer_name character varying(150),
    customer_since date,
    disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cust_address text
);


ALTER TABLE public.customer_table OWNER TO postgres;

--
-- Name: customer_table_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_table_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_table_customer_id_seq OWNER TO postgres;

--
-- Name: customer_table_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_table_customer_id_seq OWNED BY public.customer_table.customer_id;


--
-- Name: d2_batch_id_seq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_batch_id_seq (
    id integer NOT NULL,
    series character varying(10) NOT NULL,
    chamber integer NOT NULL,
    seq_date date NOT NULL,
    seq integer NOT NULL,
    d2_batch_id character varying(40) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.d2_batch_id_seq OWNER TO postgres;

--
-- Name: d2_batch_id_seq_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_batch_id_seq_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_batch_id_seq_id_seq OWNER TO postgres;

--
-- Name: d2_batch_id_seq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_batch_id_seq_id_seq OWNED BY public.d2_batch_id_seq.id;


--
-- Name: d2_chamber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_chamber (
    d2_chamber_id integer NOT NULL,
    d2_chamber_no integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.d2_chamber OWNER TO postgres;

--
-- Name: d2_chamber_d2_chamber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_chamber_d2_chamber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_chamber_d2_chamber_id_seq OWNER TO postgres;

--
-- Name: d2_chamber_d2_chamber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_chamber_d2_chamber_id_seq OWNED BY public.d2_chamber.d2_chamber_id;


--
-- Name: d2_gas_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_gas_entry (
    d2_gas_id integer NOT NULL,
    d2_batch_id character varying(20) NOT NULL,
    d2_chamber integer NOT NULL,
    gas_concentration numeric(10,3) NOT NULL,
    fresh_gas numeric(10,3) NOT NULL,
    used_gas numeric(10,3) NOT NULL,
    n2_gas numeric(10,3) NOT NULL,
    tank_pressure numeric(10,3),
    gas_issue_date date,
    gas_issue_time time without time zone,
    cycle_time_min integer,
    d2_gas_operator character varying(50),
    total_bobbins integer,
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shift character varying(10)
);


ALTER TABLE public.d2_gas_entry OWNER TO postgres;

--
-- Name: d2_gas_entry_d2_gas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_gas_entry_d2_gas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_gas_entry_d2_gas_id_seq OWNER TO postgres;

--
-- Name: d2_gas_entry_d2_gas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_gas_entry_d2_gas_id_seq OWNED BY public.d2_gas_entry.d2_gas_id;


--
-- Name: d2_issue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_issue (
    d2_isseue_id integer NOT NULL,
    d2_batch_id character varying(20) NOT NULL,
    start_operator character varying(50),
    d2_start_date date,
    d2_start_time time without time zone,
    d2_end_date date,
    d2_end_time time without time zone,
    end_operator character varying(50),
    bobbin_fid character varying(20),
    bobbin_no character varying(20),
    chamber integer NOT NULL,
    process_hours numeric(10,3),
    d2_type character varying(50),
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_h2 boolean DEFAULT false
);


ALTER TABLE public.d2_issue OWNER TO postgres;

--
-- Name: d2_issue_d2_isseue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_issue_d2_isseue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_issue_d2_isseue_id_seq OWNER TO postgres;

--
-- Name: d2_issue_d2_isseue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_issue_d2_isseue_id_seq OWNED BY public.d2_issue.d2_isseue_id;


--
-- Name: d2_issue_draft; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_issue_draft (
    d2_draft_id bigint NOT NULL,
    d2_batch_id character varying(100) NOT NULL,
    bobbin_fid character varying(100) NOT NULL,
    bobbin_no character varying(100) NOT NULL,
    chamber character varying(50),
    d2_type character varying(50),
    created_by character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.d2_issue_draft OWNER TO postgres;

--
-- Name: d2_issue_draft_d2_draft_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_issue_draft_d2_draft_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_issue_draft_d2_draft_id_seq OWNER TO postgres;

--
-- Name: d2_issue_draft_d2_draft_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_issue_draft_d2_draft_id_seq OWNED BY public.d2_issue_draft.d2_draft_id;


--
-- Name: d_fiber_cut_reasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d_fiber_cut_reasons (
    dfcr_id integer NOT NULL,
    dfcr_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false,
    indication_fiber_cut_id integer
);


ALTER TABLE public.d_fiber_cut_reasons OWNER TO postgres;

--
-- Name: d_fiber_cut_reasons_dfcr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq OWNER TO postgres;

--
-- Name: d_fiber_cut_reasons_dfcr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq OWNED BY public.d_fiber_cut_reasons.dfcr_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    d_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    disable boolean DEFAULT false
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: draw_break_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_break_analysis (
    break_analysis_id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    machine_no integer,
    break_length numeric(10,3),
    break_type character varying(50),
    break_category character varying(50),
    break_remark text,
    break_c_by character varying(50),
    entry_done_by character varying(50),
    main_break_type character varying(50),
    sub_reason character varying(50),
    next_sub_reason character varying(50),
    dist_from_pheriphery numeric(10,3),
    particle_size numeric(10,3),
    flaw_size numeric(10,3),
    bsa_remark character varying(100),
    bsa_done_by character varying(50),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_break_analysis OWNER TO postgres;

--
-- Name: draw_break_analysis_break_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_break_analysis_break_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_break_analysis_break_analysis_id_seq OWNER TO postgres;

--
-- Name: draw_break_analysis_break_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_break_analysis_break_analysis_id_seq OWNED BY public.draw_break_analysis.break_analysis_id;


--
-- Name: draw_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_entry (
    spool_id character varying(10) NOT NULL,
    preform_id character varying(10),
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    drawn_weight numeric(10,2),
    drawn_length numeric(10,2),
    balance_weight numeric(10,2),
    shift character varying(20),
    drawn_line_speed integer,
    draw_tension numeric(10,2),
    furnace_power numeric(10,2),
    furnace_argon numeric(10,2),
    furnace_he numeric(10,2),
    tube_he numeric(10,2),
    co2_flow numeric(10,2),
    n2_flow numeric(10,2),
    uv_air numeric(10,2),
    winding_observation character varying(20),
    scr_observation character varying(100),
    top_end_scrap numeric(10,2),
    bottom_end_scrap numeric(10,2),
    die_clean boolean,
    spool_status character varying(20),
    indication_fiber_cut character varying(20),
    remark text,
    primary_coating character varying(20),
    secondary_coating character varying(20),
    coating_type character varying(20),
    primary_pressure numeric(10,2),
    secondary_pressure numeric(10,2),
    primary_batch character varying(20),
    secondary_batch character varying(20),
    process_type character varying(20) NOT NULL,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shift_incharge character varying(20),
    furnace_operator character varying(20),
    die_operator character varying(20),
    ground_operator character varying(20),
    indication_reason character varying(20),
    tower_no character varying(20) CONSTRAINT draw_entry_tower_id_not_null NOT NULL,
    is_pt_allocate boolean DEFAULT false,
    preform_type character varying(20),
    product_type character varying(20) NOT NULL,
    spool_no integer NOT NULL,
    spool_fid character varying(50) NOT NULL,
    is_first boolean DEFAULT false,
    is_last boolean DEFAULT false,
    pt_break_count integer DEFAULT 0,
    start_length numeric(10,2),
    end_length numeric(10,2),
    CONSTRAINT draw_entry_spool_status_check CHECK (((spool_status)::text = ANY (ARRAY[('Ok'::character varying)::text, ('Not Ok'::character varying)::text])))
);


ALTER TABLE public.draw_entry OWNER TO postgres;

--
-- Name: draw_flaw_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_flaw_details (
    draw_flaw_id integer NOT NULL,
    spool_id character varying(10) NOT NULL,
    reason text CONSTRAINT draw_flaw_details_flaw_desc_not_null NOT NULL,
    pos1 numeric(10,2),
    pos2 numeric(10,2),
    defect_length numeric(10,2),
    actual_cutting numeric(10,2),
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_flaw_details OWNER TO postgres;

--
-- Name: draw_flaw_details_draw_flaw_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_flaw_details_draw_flaw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_flaw_details_draw_flaw_id_seq OWNER TO postgres;

--
-- Name: draw_flaw_details_draw_flaw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_flaw_details_draw_flaw_id_seq OWNED BY public.draw_flaw_details.draw_flaw_id;


--
-- Name: draw_shift_plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_shift_plan (
    dsp_id integer NOT NULL,
    plan_date date,
    shift character varying(10),
    die_operator character varying(50),
    ground_operator character varying(50),
    furnace_operator character varying(50),
    shift_incharge character varying(50),
    tower_no integer NOT NULL,
    theo_speed numeric(10,3),
    actu_speed numeric(10,3),
    ch_ov_num integer NOT NULL,
    ch_ov_time numeric(10,3),
    ch_ov_tl numeric(10,3),
    fur_cl_time numeric(10,3),
    pm_tl numeric(10,3),
    downtime numeric(10,3),
    draw_plan numeric(10,3),
    shift_time numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_shift_plan OWNER TO postgres;

--
-- Name: draw_shift_plan_dsp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_shift_plan_dsp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_shift_plan_dsp_id_seq OWNER TO postgres;

--
-- Name: draw_shift_plan_dsp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_shift_plan_dsp_id_seq OWNED BY public.draw_shift_plan.dsp_id;


--
-- Name: draw_tower; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_tower (
    tower_id integer NOT NULL,
    tower_no integer NOT NULL,
    furnace_count integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false
);


ALTER TABLE public.draw_tower OWNER TO postgres;

--
-- Name: draw_tower_tower_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_tower_tower_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_tower_tower_id_seq OWNER TO postgres;

--
-- Name: draw_tower_tower_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_tower_tower_id_seq OWNED BY public.draw_tower.tower_id;


--
-- Name: draw_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_users (
    draw_user_id integer NOT NULL,
    emp_id character varying(20),
    draw_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.draw_users OWNER TO postgres;

--
-- Name: draw_users_draw_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_users_draw_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_users_draw_user_id_seq OWNER TO postgres;

--
-- Name: draw_users_draw_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_users_draw_user_id_seq OWNED BY public.draw_users.draw_user_id;


--
-- Name: dyanmic_fartique; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyanmic_fartique (
    dynamic_fartique_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    gr_clause_no numeric(10,3),
    title character varying(200),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dyanmic_fartique OWNER TO postgres;

--
-- Name: dyanmic_fartique_dynamic_fartique_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyanmic_fartique_dynamic_fartique_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyanmic_fartique_dynamic_fartique_id_seq OWNER TO postgres;

--
-- Name: dyanmic_fartique_dynamic_fartique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyanmic_fartique_dynamic_fartique_id_seq OWNED BY public.dyanmic_fartique.dynamic_fartique_id;


--
-- Name: dyanmic_fartique_speed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyanmic_fartique_speed (
    dyanmic_fartique_speed_id integer NOT NULL,
    dynamic_fartique_id integer,
    bobbin_no character varying(50),
    fiber_type character varying(50),
    speed numeric(10,3),
    ts_kg numeric(10,3),
    ext_mm numeric(10,3),
    gpa numeric(10,3),
    time_min numeric(10,3),
    stress_rate numeric(10,3),
    ln_stress_rate numeric(10,3),
    ln_stress numeric(10,3),
    slope numeric(10,3),
    n_value numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dyanmic_fartique_speed_fiber_type_check CHECK (((fiber_type)::text = ANY (ARRAY[('Unaged Fiber'::character varying)::text, ('Aged Fiber'::character varying)::text])))
);


ALTER TABLE public.dyanmic_fartique_speed OWNER TO postgres;

--
-- Name: dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq OWNER TO postgres;

--
-- Name: dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq OWNED BY public.dyanmic_fartique_speed.dyanmic_fartique_speed_id;


--
-- Name: f_cable_cable_cutoff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_cable_cable_cutoff (
    id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    length numeric(10,2),
    measurement_date date,
    measurement_time character varying(20),
    operator character varying(50),
    cable_cutoff_flag character varying(5),
    cutoff_wavelength numeric(10,2),
    target_column character varying(30),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.f_cable_cable_cutoff OWNER TO postgres;

--
-- Name: f_cable_cable_cutoff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_cable_cable_cutoff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_cable_cable_cutoff_id_seq OWNER TO postgres;

--
-- Name: f_cable_cable_cutoff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_cable_cable_cutoff_id_seq OWNED BY public.f_cable_cable_cutoff.id;


--
-- Name: f_cd_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_cd_history (
    id integer NOT NULL,
    bobbin_id character varying(100) NOT NULL,
    length numeric(12,3),
    measurement_date date,
    measurement_time time without time zone,
    wavelength numeric(10,3),
    delay numeric(12,3),
    dispersion numeric(10,3),
    slope numeric(10,3)
);


ALTER TABLE public.f_cd_history OWNER TO postgres;

--
-- Name: f_cd_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_cd_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_cd_history_id_seq OWNER TO postgres;

--
-- Name: f_cd_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_cd_history_id_seq OWNED BY public.f_cd_history.id;


--
-- Name: f_coating_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_coating_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    secondary_coating_dia_top numeric,
    secondary_coating_concentricity_top numeric,
    coating_ovality_top numeric,
    primary_coating_dia_top numeric,
    primary_coating_concentricity_top numeric,
    coating_inner_non_circularity_top numeric,
    coating_fiber_dia_top numeric,
    coating_fiber_concentricity_top numeric,
    coating_fiber_non_circularity_top numeric,
    secondary_coating_dia_bottom numeric,
    secondary_coating_concentricity_bottom numeric,
    coating_ovality_bottom numeric,
    primary_coating_dia_bottom numeric,
    primary_coating_concentricity_bottom numeric,
    coating_inner_non_circularity_bottom numeric,
    coating_fiber_dia_bottom numeric,
    coating_fiber_concentricity_bottom numeric,
    coating_fiber_non_circularity_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_coating_history OWNER TO postgres;

--
-- Name: f_coating_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_coating_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_coating_history_id_seq OWNER TO postgres;

--
-- Name: f_coating_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_coating_history_id_seq OWNED BY public.f_coating_history.id;


--
-- Name: f_curl_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_curl_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    fiber_curl_top numeric,
    fiber_curl_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_curl_history OWNER TO postgres;

--
-- Name: f_curl_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_curl_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_curl_history_id_seq OWNER TO postgres;

--
-- Name: f_curl_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_curl_history_id_seq OWNED BY public.f_curl_history.id;


--
-- Name: f_cutoff_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_cutoff_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    cut_off_top numeric,
    cut_off_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_cutoff_history OWNER TO postgres;

--
-- Name: f_cutoff_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_cutoff_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_cutoff_history_id_seq OWNER TO postgres;

--
-- Name: f_cutoff_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_cutoff_history_id_seq OWNED BY public.f_cutoff_history.id;


--
-- Name: f_geometry_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_geometry_history (
    id integer NOT NULL,
    bobbin_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    core_dia_top numeric,
    core_ovality_top numeric,
    core_clad_concentricity_top numeric,
    clad_dia_top numeric,
    clad_ovality_top numeric,
    core_dia_bottom numeric,
    core_ovality_bottom numeric,
    core_clad_concentricity_bottom numeric,
    clad_dia_bottom numeric,
    clad_ovality_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_geometry_history OWNER TO postgres;

--
-- Name: f_geometry_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_geometry_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_geometry_history_id_seq OWNER TO postgres;

--
-- Name: f_geometry_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_geometry_history_id_seq OWNED BY public.f_geometry_history.id;


--
-- Name: f_length_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_length_history (
    id integer NOT NULL,
    bobbin_id character varying,
    length numeric,
    measurement_date date,
    measurement_time character varying,
    measured_length numeric,
    measured_time_us numeric,
    wavelength numeric
);


ALTER TABLE public.f_length_history OWNER TO postgres;

--
-- Name: f_length_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_length_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_length_history_id_seq OWNER TO postgres;

--
-- Name: f_length_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_length_history_id_seq OWNED BY public.f_length_history.id;


--
-- Name: f_mbend_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_mbend_history (
    id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    measurement_date date,
    measurement_time character varying(20),
    operator character varying(50),
    sample_type character varying(20),
    turn numeric,
    mandrel_diameter numeric,
    sample_length numeric,
    wavelength numeric,
    attenuation numeric(10,4),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.f_mbend_history OWNER TO postgres;

--
-- Name: f_mbend_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_mbend_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_mbend_history_id_seq OWNER TO postgres;

--
-- Name: f_mbend_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_mbend_history_id_seq OWNED BY public.f_mbend_history.id;


--
-- Name: f_mfd_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_mfd_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    mfd_wavelength_top_1310 numeric,
    gaussian_mfd_top_1310 numeric,
    mfd_1310_top numeric,
    effective_area_1310 numeric,
    mfd_wavelength_bottom_1310 numeric,
    gaussian_mfd_bottom_1310 numeric,
    mfd_1310_bottom numeric,
    effective_area_bottom_1310 numeric,
    mfd_wavelength_top_1550 numeric,
    gaussian_mfd_top_1550 numeric,
    mfd_1550_top numeric,
    effective_area_1550 numeric,
    mfd_wavelength_bottom_1550 numeric,
    gaussian_mfd_bottom_1550 numeric,
    mfd_1550_bottom numeric,
    effective_area_bottom_1550 numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_mfd_history OWNER TO postgres;

--
-- Name: f_mfd_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_mfd_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_mfd_history_id_seq OWNER TO postgres;

--
-- Name: f_mfd_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_mfd_history_id_seq OWNED BY public.f_mfd_history.id;


--
-- Name: f_pmd_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_pmd_history (
    id integer NOT NULL,
    bobbin_id character varying(100) NOT NULL,
    length numeric(12,3),
    measurement_date date,
    measurement_time time without time zone,
    reported_wavelength integer,
    pmd numeric(10,4),
    pmd_coefficient numeric(10,4),
    gaussian_compliance numeric(10,4),
    second_order_pmd numeric(10,4),
    second_order_pmd_coeff numeric(10,4)
);


ALTER TABLE public.f_pmd_history OWNER TO postgres;

--
-- Name: f_pmd_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_pmd_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_pmd_history_id_seq OWNER TO postgres;

--
-- Name: f_pmd_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_pmd_history_id_seq OWNED BY public.f_pmd_history.id;


--
-- Name: f_spectral_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_spectral_history (
    id integer NOT NULL,
    bobbin_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    location character varying(50),
    wavelength numeric,
    attenuation numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_spectral_history OWNER TO postgres;

--
-- Name: f_spectral_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_spectral_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_spectral_history_id_seq OWNER TO postgres;

--
-- Name: f_spectral_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_spectral_history_id_seq OWNED BY public.f_spectral_history.id;


--
-- Name: fg_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fg_color (
    fg_color_id integer NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    current_color character varying(20),
    require_color character varying(20),
    total_length numeric(10,3),
    balance_length numeric(10,3),
    request_by character varying(50),
    date date,
    "time" time without time zone,
    last_child_fid character varying(50),
    count integer NOT NULL,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    remark text,
    is_done boolean DEFAULT false,
    col_jcard_no integer NOT NULL,
    customer_name character varying(150)
);


ALTER TABLE public.fg_color OWNER TO postgres;

--
-- Name: fg_color_fg_color_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fg_color_fg_color_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fg_color_fg_color_id_seq OWNER TO postgres;

--
-- Name: fg_color_fg_color_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fg_color_fg_color_id_seq OWNED BY public.fg_color.fg_color_id;


--
-- Name: fg_rewind; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fg_rewind (
    fg_rewind_id integer NOT NULL,
    bobbin_no character varying(10),
    bobbin_fid character varying(50),
    total_length numeric(10,3),
    balance_length numeric(10,3),
    rewinding_type character varying(50),
    last_child_fid character varying(50),
    count integer NOT NULL,
    request_by character varying(50),
    date date,
    "time" time without time zone,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_rew_done boolean DEFAULT false,
    CONSTRAINT fg_rewind_rewinding_type_check CHECK (((rewinding_type)::text = ANY (ARRAY[('CUT'::character varying)::text, ('REWINDING'::character varying)::text])))
);


ALTER TABLE public.fg_rewind OWNER TO postgres;

--
-- Name: fg_rewind_fg_rewind_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fg_rewind_fg_rewind_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fg_rewind_fg_rewind_id_seq OWNER TO postgres;

--
-- Name: fg_rewind_fg_rewind_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fg_rewind_fg_rewind_id_seq OWNED BY public.fg_rewind.fg_rewind_id;


--
-- Name: fiber_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiber_color (
    fiber_color_id integer NOT NULL,
    color character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fiber_color OWNER TO postgres;

--
-- Name: fiber_color_fiber_color_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiber_color_fiber_color_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiber_color_fiber_color_id_seq OWNER TO postgres;

--
-- Name: fiber_color_fiber_color_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiber_color_fiber_color_id_seq OWNED BY public.fiber_color.fiber_color_id;


--
-- Name: fiber_cut_indication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiber_cut_indication (
    indication_fiber_cut_id integer NOT NULL,
    indication_name character varying(100) NOT NULL,
    disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fiber_cut_indication OWNER TO postgres;

--
-- Name: fiber_cut_indication_indication_fiber_cut_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiber_cut_indication_indication_fiber_cut_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiber_cut_indication_indication_fiber_cut_id_seq OWNER TO postgres;

--
-- Name: fiber_cut_indication_indication_fiber_cut_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiber_cut_indication_indication_fiber_cut_id_seq OWNED BY public.fiber_cut_indication.indication_fiber_cut_id;


--
-- Name: function_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.function_reports (
    id integer NOT NULL,
    report_name character varying(255) NOT NULL,
    schema_name character varying(100) DEFAULT 'public'::character varying NOT NULL,
    function_name character varying(255) NOT NULL,
    section character varying(100),
    description text,
    is_active boolean DEFAULT true,
    param_config jsonb DEFAULT '[]'::jsonb,
    created_by character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.function_reports OWNER TO postgres;

--
-- Name: function_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.function_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.function_reports_id_seq OWNER TO postgres;

--
-- Name: function_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.function_reports_id_seq OWNED BY public.function_reports.id;


--
-- Name: grade_mandatory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_mandatory (
    grade_mandatory_id integer NOT NULL,
    grade character varying(20),
    product_type character varying(50),
    mandatory_params text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.grade_mandatory OWNER TO postgres;

--
-- Name: grade_mandatory_grade_mandatory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grade_mandatory_grade_mandatory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grade_mandatory_grade_mandatory_id_seq OWNER TO postgres;

--
-- Name: grade_mandatory_grade_mandatory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grade_mandatory_grade_mandatory_id_seq OWNED BY public.grade_mandatory.grade_mandatory_id;


--
-- Name: h2_ageing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h2_ageing (
    h2_ageing_id integer NOT NULL,
    d2_batch_id character varying(30) NOT NULL,
    h2_batch_id character varying(30) NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    h2_date date,
    h2_time time without time zone,
    h2_operator character varying(50),
    before_date date,
    before_time time without time zone,
    before_operator character varying(50),
    attn_1240_before numeric(10,3),
    attn_1310_before numeric(10,3),
    attn_1383_before numeric(10,3),
    attn_1550_before numeric(10,3),
    attn_1625_before numeric(10,3),
    after_date date,
    after_time time without time zone,
    after_operator character varying(50),
    attn_1240_after numeric(10,3),
    attn_1310_after numeric(10,3),
    attn_1383_after numeric(10,3),
    attn_1550_after numeric(10,3),
    attn_1625_after numeric(10,3),
    date_14_day date,
    time_14_day time without time zone,
    date_14_day_operator character varying(50),
    attn_1240_14_days numeric(10,3),
    attn_1310_14_days numeric(10,3),
    attn_1383_14_days numeric(10,3),
    attn_1550_14_days numeric(10,3),
    attn_1625_14_days numeric(10,3),
    logged_in_user integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.h2_ageing OWNER TO postgres;

--
-- Name: h2_ageing_h2_ageing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h2_ageing_h2_ageing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h2_ageing_h2_ageing_id_seq OWNER TO postgres;

--
-- Name: h2_ageing_h2_ageing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h2_ageing_h2_ageing_id_seq OWNED BY public.h2_ageing.h2_ageing_id;


--
-- Name: h2_chamber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h2_chamber (
    h2_chamber_id integer NOT NULL,
    h2_chamber_no integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.h2_chamber OWNER TO postgres;

--
-- Name: h2_chamber_h2_chamber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h2_chamber_h2_chamber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h2_chamber_h2_chamber_id_seq OWNER TO postgres;

--
-- Name: h2_chamber_h2_chamber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h2_chamber_h2_chamber_id_seq OWNED BY public.h2_chamber.h2_chamber_id;


--
-- Name: handle_join; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.handle_join (
    handle_join_id integer NOT NULL,
    preform_id character varying(10) NOT NULL,
    dia1 numeric(10,2),
    dia2 numeric(10,2),
    dia3 numeric(10,2),
    dia4 numeric(10,2),
    dia5 numeric(10,2),
    h2flow1 numeric(10,2),
    h2flow2 numeric(10,2),
    h2flow3 numeric(10,2),
    o2line1_flow1 numeric(10,2),
    o2line1_flow2 numeric(10,2),
    o2line1_flow3 numeric(10,2),
    h2flow1_time numeric(10,2),
    h2flow2_time numeric(10,2),
    h2flow3_time numeric(10,2),
    o2line1_flow1_time numeric(10,2),
    o2line1_flow2_time numeric(10,2),
    o2line1_flow3_time numeric(10,2),
    h2flow1_cons numeric(10,2),
    h2flow2_cons numeric(10,2),
    h2flow3_cons numeric(10,2),
    o2line1_flow1_cons numeric(10,2),
    o2line1_flow2_cons numeric(10,2),
    o2line1_flow3_cons numeric(10,2),
    handle_length numeric(10,2),
    handle_diameter numeric(10,2),
    cone_length numeric(10,2),
    handle_number character varying(50),
    joined_by integer NOT NULL,
    additional_notes text,
    is_handle_join boolean DEFAULT true NOT NULL,
    is_allocate boolean DEFAULT false NOT NULL,
    disconnect_remark text,
    disconnected_at timestamp without time zone,
    disconnected_by integer,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    handle_rejected boolean DEFAULT false
);


ALTER TABLE public.handle_join OWNER TO postgres;

--
-- Name: handle_join_handle_join_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.handle_join_handle_join_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handle_join_handle_join_id_seq OWNER TO postgres;

--
-- Name: handle_join_handle_join_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.handle_join_handle_join_id_seq OWNED BY public.handle_join.handle_join_id;


--
-- Name: hot_water_ch_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hot_water_ch_entry (
    hot_water_ch_id integer NOT NULL,
    hot_water_entry_id integer,
    max_ch_nm_1310 numeric(10,3),
    max_ch_nm_1550 numeric(10,3),
    max_ch_nm_1625 numeric(10,3)
);


ALTER TABLE public.hot_water_ch_entry OWNER TO postgres;

--
-- Name: hot_water_ch_entry_hot_water_ch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hot_water_ch_entry_hot_water_ch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hot_water_ch_entry_hot_water_ch_id_seq OWNER TO postgres;

--
-- Name: hot_water_ch_entry_hot_water_ch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hot_water_ch_entry_hot_water_ch_id_seq OWNED BY public.hot_water_ch_entry.hot_water_ch_id;


--
-- Name: hot_water_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hot_water_day_entry (
    hot_water_day_entry_id integer NOT NULL,
    hot_water_entry_id integer,
    bobbin_no character varying(50),
    hw_date date,
    hw_day integer,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hot_water_day_entry OWNER TO postgres;

--
-- Name: hot_water_day_entry_hot_water_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hot_water_day_entry_hot_water_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hot_water_day_entry_hot_water_day_entry_id_seq OWNER TO postgres;

--
-- Name: hot_water_day_entry_hot_water_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hot_water_day_entry_hot_water_day_entry_id_seq OWNED BY public.hot_water_day_entry.hot_water_day_entry_id;


--
-- Name: hot_water_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hot_water_entry (
    hot_water_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    title character varying(200),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    temp numeric(10,3),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hot_water_entry OWNER TO postgres;

--
-- Name: hot_water_entry_hot_water_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hot_water_entry_hot_water_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hot_water_entry_hot_water_entry_id_seq OWNER TO postgres;

--
-- Name: hot_water_entry_hot_water_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hot_water_entry_hot_water_entry_id_seq OWNED BY public.hot_water_entry.hot_water_entry_id;


--
-- Name: htha_ch_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.htha_ch_entry (
    htha_ch_id integer NOT NULL,
    htha_entry_id integer,
    max_ch_nm_1310 numeric(10,3),
    max_ch_nm_1550 numeric(10,3),
    max_ch_nm_1625 numeric(10,3)
);


ALTER TABLE public.htha_ch_entry OWNER TO postgres;

--
-- Name: htha_ch_entry_htha_ch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.htha_ch_entry_htha_ch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.htha_ch_entry_htha_ch_id_seq OWNER TO postgres;

--
-- Name: htha_ch_entry_htha_ch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.htha_ch_entry_htha_ch_id_seq OWNED BY public.htha_ch_entry.htha_ch_id;


--
-- Name: htha_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.htha_day_entry (
    htha_day_entry_id integer NOT NULL,
    htha_entry_id integer,
    bobbin_no character varying(50),
    htha_date date,
    htha_day integer,
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    at_1310 numeric(10,3)
);


ALTER TABLE public.htha_day_entry OWNER TO postgres;

--
-- Name: htha_day_entry_htha_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.htha_day_entry_htha_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.htha_day_entry_htha_day_entry_id_seq OWNER TO postgres;

--
-- Name: htha_day_entry_htha_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.htha_day_entry_htha_day_entry_id_seq OWNED BY public.htha_day_entry.htha_day_entry_id;


--
-- Name: htha_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.htha_entry (
    htha_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    gr_clause_no numeric(10,3),
    title character varying(200),
    req_per_gr text,
    testing_standard character varying(50),
    marker_a character varying(50),
    marker_b character varying(50),
    temp numeric(10,3),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.htha_entry OWNER TO postgres;

--
-- Name: htha_entry_htha_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.htha_entry_htha_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.htha_entry_htha_entry_id_seq OWNER TO postgres;

--
-- Name: htha_entry_htha_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.htha_entry_htha_entry_id_seq OWNED BY public.htha_entry.htha_entry_id;


--
-- Name: mail_drafts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mail_drafts (
    id integer NOT NULL,
    draft_name character varying(200) NOT NULL,
    provider character varying(10) NOT NULL,
    "to" character varying(500) NOT NULL,
    cc character varying(500),
    bcc character varying(500),
    subject character varying(500) NOT NULL,
    text text,
    html text,
    template_name character varying(100),
    template_vars jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT mail_drafts_provider_check CHECK (((provider)::text = ANY ((ARRAY['gmail'::character varying, 'org'::character varying])::text[])))
);


ALTER TABLE public.mail_drafts OWNER TO postgres;

--
-- Name: mail_drafts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mail_drafts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mail_drafts_id_seq OWNER TO postgres;

--
-- Name: mail_drafts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mail_drafts_id_seq OWNED BY public.mail_drafts.id;


--
-- Name: master_preform_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_preform_type (
    preform_type_id integer NOT NULL,
    preform_type_name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(50)
);


ALTER TABLE public.master_preform_type OWNER TO postgres;

--
-- Name: master_preform_type_preform_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_preform_type_preform_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_preform_type_preform_type_id_seq OWNER TO postgres;

--
-- Name: master_preform_type_preform_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_preform_type_preform_type_id_seq OWNED BY public.master_preform_type.preform_type_id;


--
-- Name: mat_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mat_stock (
    mat_stock_id integer NOT NULL,
    m_code character varying(20) NOT NULL,
    batch_id character varying(10) NOT NULL,
    uom character varying(10) NOT NULL,
    activity character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    qty numeric(10,3),
    balance_qty numeric(10,3),
    p_count integer DEFAULT 0,
    last_fid character varying(50) NOT NULL,
    pending_after_rejection character varying(50) DEFAULT NULL::character varying
);


ALTER TABLE public.mat_stock OWNER TO postgres;

--
-- Name: mat_stock_mat_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mat_stock_mat_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mat_stock_mat_stock_id_seq OWNER TO postgres;

--
-- Name: mat_stock_mat_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mat_stock_mat_stock_id_seq OWNED BY public.mat_stock.mat_stock_id;


--
-- Name: material_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_master (
    material_code character varying(50) NOT NULL,
    material_category character varying(50) NOT NULL,
    material_description text NOT NULL,
    preform_type character varying(50),
    product_type character varying(50),
    uom character varying(10) NOT NULL,
    is_sample boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_master OWNER TO postgres;

--
-- Name: order_comp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_comp (
    order_comp_id integer NOT NULL,
    order_no character varying(10),
    material_code character varying(20),
    mat_desc text,
    qty numeric(10,2),
    uom character varying(10),
    movement_type integer,
    storage_location character varying(10)
);


ALTER TABLE public.order_comp OWNER TO postgres;

--
-- Name: order_comp_order_comp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_comp_order_comp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_comp_order_comp_id_seq OWNER TO postgres;

--
-- Name: order_comp_order_comp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_comp_order_comp_id_seq OWNED BY public.order_comp.order_comp_id;


--
-- Name: order_conf; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_conf (
    order_conf_id integer NOT NULL,
    order_no character varying(10),
    confrmation_no integer,
    confirmation_counter integer,
    cancelling_flag boolean DEFAULT false,
    operation_no integer,
    confirmed_qty numeric(10,2),
    gr_document character varying(10),
    inspection_lot bigint,
    ud boolean DEFAULT false,
    fg_batch character varying(10),
    ud_required boolean DEFAULT false
);


ALTER TABLE public.order_conf OWNER TO postgres;

--
-- Name: order_conf_order_conf_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_conf_order_conf_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_conf_order_conf_id_seq OWNER TO postgres;

--
-- Name: order_conf_order_conf_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_conf_order_conf_id_seq OWNED BY public.order_conf.order_conf_id;


--
-- Name: order_hdr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_hdr (
    order_no character varying(10) NOT NULL,
    material_code character varying(20),
    order_qty numeric(10,2),
    uom character varying(10),
    gr_qty numeric(10,2),
    order_status character varying(20),
    order_creation_date date,
    updated_at timestamp without time zone,
    storage_location character varying(10),
    type character varying(10),
    is_active boolean DEFAULT true
);


ALTER TABLE public.order_hdr OWNER TO postgres;

--
-- Name: order_opr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_opr (
    order_opr_id integer NOT NULL,
    order_no character varying(10),
    operation_no integer,
    workcenter character varying(10),
    operation_qty numeric(10,2),
    activity_1 integer,
    activity_2 integer,
    activity_3 integer,
    activity_4 integer,
    activity_5 integer,
    activity_6 integer
);


ALTER TABLE public.order_opr OWNER TO postgres;

--
-- Name: order_opr_order_opr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_opr_order_opr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_opr_order_opr_id_seq OWNER TO postgres;

--
-- Name: order_opr_order_opr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_opr_order_opr_id_seq OWNED BY public.order_opr.order_opr_id;


--
-- Name: packing_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packing_order (
    packing_order_id integer NOT NULL,
    order_no character varying(50) NOT NULL,
    customer_name character varying(100),
    required_km numeric(10,2),
    box_capacity integer NOT NULL,
    stack_capacity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_packed boolean DEFAULT false,
    tc_generated boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.packing_order OWNER TO postgres;

--
-- Name: packing_order_bobbin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packing_order_bobbin (
    packing_order_bobbin_id integer NOT NULL,
    packing_order character varying(50) NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    length_km numeric(10,2),
    stack_no character varying(50),
    box_no character varying(50)
);


ALTER TABLE public.packing_order_bobbin OWNER TO postgres;

--
-- Name: packing_order_bobbin_packing_order_bobbin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packing_order_bobbin_packing_order_bobbin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packing_order_bobbin_packing_order_bobbin_id_seq OWNER TO postgres;

--
-- Name: packing_order_bobbin_packing_order_bobbin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packing_order_bobbin_packing_order_bobbin_id_seq OWNED BY public.packing_order_bobbin.packing_order_bobbin_id;


--
-- Name: packing_order_packing_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packing_order_packing_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packing_order_packing_order_id_seq OWNER TO postgres;

--
-- Name: packing_order_packing_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packing_order_packing_order_id_seq OWNED BY public.packing_order.packing_order_id;


--
-- Name: preform_accept; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_accept (
    acceptance_id integer NOT NULL,
    preform_id character varying(10) NOT NULL,
    preform_weight numeric(10,3),
    charge_weight numeric(10,3),
    preform_length numeric(10,2),
    charge_length numeric(10,2),
    drawing_length numeric(10,2),
    material_code character varying(20),
    dia_variation numeric(10,2),
    cut_off numeric(10,2),
    mfd numeric(10,2),
    accepted_by character varying(20),
    preform_type character varying(10),
    material_description text,
    remarks text,
    draw_instruction text,
    acceptance_status character varying(10) DEFAULT 'accepted'::character varying NOT NULL,
    rejection_note text,
    logged_in_user character varying(50),
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_handle_join boolean DEFAULT false NOT NULL,
    product_type character(20) NOT NULL,
    preform_vendor_id integer,
    CONSTRAINT preform_accept_acceptance_status_check CHECK (((acceptance_status)::text = ANY (ARRAY[('accepted'::character varying)::text, ('rejected'::character varying)::text])))
);


ALTER TABLE public.preform_accept OWNER TO postgres;

--
-- Name: preform_accept_acceptance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_accept_acceptance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_accept_acceptance_id_seq OWNER TO postgres;

--
-- Name: preform_accept_acceptance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_accept_acceptance_id_seq OWNED BY public.preform_accept.acceptance_id;


--
-- Name: preform_allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_allocation (
    allocation_id integer NOT NULL,
    preform_id character varying(10) NOT NULL,
    allocation_date date NOT NULL,
    tower_no character varying(20) CONSTRAINT preform_allocation_tower_id_not_null NOT NULL,
    shift character varying(20) CONSTRAINT preform_allocation_shift_id_not_null NOT NULL,
    operator character varying(20) CONSTRAINT preform_allocation_operator_id_not_null NOT NULL,
    preform_type character varying(20),
    product_type character varying(20),
    preform_draw boolean DEFAULT false,
    average_diameter numeric(10,2),
    draw_instruction text,
    process_remarks text,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.preform_allocation OWNER TO postgres;

--
-- Name: preform_allocation_allocation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_allocation_allocation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_allocation_allocation_id_seq OWNER TO postgres;

--
-- Name: preform_allocation_allocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_allocation_allocation_id_seq OWNED BY public.preform_allocation.allocation_id;


--
-- Name: preform_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_data (
    preform_id character varying(10) NOT NULL,
    preform_weight numeric(10,3),
    preform_type character varying(10),
    material_code character varying(20),
    material_description text,
    plant character varying(10),
    storage_location character varying(10),
    uom character varying(10) DEFAULT 'KG'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    product_type character varying(20)
);


ALTER TABLE public.preform_data OWNER TO postgres;

--
-- Name: preform_process_type_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_process_type_mapping (
    mapping_id integer NOT NULL,
    preform_type character varying(50) NOT NULL,
    process_type_id integer NOT NULL
);


ALTER TABLE public.preform_process_type_mapping OWNER TO postgres;

--
-- Name: preform_process_type_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_process_type_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_process_type_mapping_mapping_id_seq OWNER TO postgres;

--
-- Name: preform_process_type_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_process_type_mapping_mapping_id_seq OWNED BY public.preform_process_type_mapping.mapping_id;


--
-- Name: preform_vendor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_vendor (
    preform_vendor_id integer NOT NULL,
    vendor_code character varying(50),
    vendor_name character varying(100) NOT NULL,
    vendor_initial character varying(10) NOT NULL,
    is_disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.preform_vendor OWNER TO postgres;

--
-- Name: preform_vendor_preform_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_vendor_preform_vendor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_vendor_preform_vendor_id_seq OWNER TO postgres;

--
-- Name: preform_vendor_preform_vendor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_vendor_preform_vendor_id_seq OWNED BY public.preform_vendor.preform_vendor_id;


--
-- Name: process_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_order (
    process_o_id integer NOT NULL,
    process_o_no character varying(50),
    material_code character varying(50) NOT NULL,
    process_qty numeric(12,3) NOT NULL,
    balance_qty numeric(12,3) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.process_order OWNER TO postgres;

--
-- Name: process_order_process_o_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.process_order_process_o_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_order_process_o_id_seq OWNER TO postgres;

--
-- Name: process_order_process_o_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.process_order_process_o_id_seq OWNED BY public.process_order.process_o_id;


--
-- Name: process_type_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_type_master (
    process_type_id integer NOT NULL,
    process_type integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.process_type_master OWNER TO postgres;

--
-- Name: process_type_master_process_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.process_type_master_process_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_type_master_process_type_id_seq OWNER TO postgres;

--
-- Name: process_type_master_process_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.process_type_master_process_type_id_seq OWNED BY public.process_type_master.process_type_id;


--
-- Name: pt_allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_allocation (
    pt_allocation_id integer NOT NULL,
    spool_id character varying(10) NOT NULL,
    allocation_date date DEFAULT CURRENT_DATE,
    preform_id character varying(10) NOT NULL,
    tower_no character varying(10) CONSTRAINT pt_allocation_tower_id_not_null NOT NULL,
    drawn_length numeric(10,2) NOT NULL,
    product_type character varying(20),
    pt_strain integer NOT NULL,
    pt_machine_no integer CONSTRAINT pt_allocation_pt_machine_id_not_null NOT NULL,
    allocated_by character varying(50) CONSTRAINT pt_allocation_allocated_by_id_not_null NOT NULL,
    shift_incharge character varying(50) CONSTRAINT pt_allocation_shift_incharge_id_not_null NOT NULL,
    allocation_remark text,
    is_pt_complete boolean DEFAULT false,
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_reject boolean DEFAULT false
);


ALTER TABLE public.pt_allocation OWNER TO postgres;

--
-- Name: pt_allocation_pt_allocation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_allocation_pt_allocation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_allocation_pt_allocation_id_seq OWNER TO postgres;

--
-- Name: pt_allocation_pt_allocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_allocation_pt_allocation_id_seq OWNED BY public.pt_allocation.pt_allocation_id;


--
-- Name: pt_break_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_break_analysis (
    break_analysis_id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    machine_no integer,
    break_length numeric(10,3),
    break_type character varying(50),
    break_category character varying(50),
    break_remark text,
    break_c_by character varying(50),
    entry_done_by character varying(50),
    main_break_type character varying(50),
    sub_reason character varying(50),
    next_sub_reason character varying(50),
    dist_from_pheriphery numeric(10,3),
    particle_size numeric(10,3),
    flaw_size numeric(10,3),
    bsa_remark character varying(100),
    bsa_done_by character varying(50),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pt_break_analysis OWNER TO postgres;

--
-- Name: pt_break_analysis_break_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_break_analysis_break_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_break_analysis_break_analysis_id_seq OWNER TO postgres;

--
-- Name: pt_break_analysis_break_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_break_analysis_break_analysis_id_seq OWNED BY public.pt_break_analysis.break_analysis_id;


--
-- Name: pt_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_entry (
    pt_entry_id integer NOT NULL,
    spool_id character varying(10) NOT NULL,
    preform_id character varying(10) NOT NULL,
    drawn_length numeric(10,2),
    tower_no integer CONSTRAINT pt_entry_dt_no_not_null NOT NULL,
    drawn_date date,
    pt_entry date DEFAULT CURRENT_DATE,
    fid character varying(20),
    bobbin_no character varying(10),
    spool_status character varying(20),
    pt_machine integer NOT NULL,
    operator_name character varying(50),
    shift_incharge character varying(50),
    bobbin_color character varying(20),
    bobbin_type character varying(20),
    pt_length numeric(10,2),
    status character varying(50) NOT NULL,
    payoff_vibration character varying(20),
    dancer_vibration character varying(20),
    rejection boolean DEFAULT false,
    rejection_reason character varying(20),
    bal_draw_rejection boolean DEFAULT false,
    bal_draw_rejection_reason character varying(20),
    multiple_end boolean DEFAULT false,
    scratch boolean DEFAULT false,
    pt_scrap boolean DEFAULT false,
    ztmd boolean DEFAULT false,
    ztmd_id character varying(20),
    doc boolean DEFAULT false,
    doc_id character varying(20),
    is_break boolean DEFAULT false,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_first boolean DEFAULT false,
    is_last boolean DEFAULT false,
    start_length numeric(10,3),
    end_length numeric(10,3),
    before_rejection character varying(50),
    after_rejection character varying(50),
    active_rejection_type character varying(50),
    pt_flaw_remark text,
    a_cut_flaw text,
    full_check boolean DEFAULT false,
    is_sample boolean DEFAULT false,
    full_mbend boolean,
    no integer DEFAULT 0,
    shift character varying(10),
    pt_scrap_reason character varying(20),
    CONSTRAINT check_pt_scrap_reason CHECK ((((pt_scrap_reason)::text = ANY ((ARRAY['NO GOOD LENGTH'::character varying, 'BREAK'::character varying, 'WEAK FIBER'::character varying])::text[])) OR (pt_scrap_reason IS NULL))),
    CONSTRAINT pt_entry_pt_scrap_reason_check CHECK (((pt_scrap_reason)::text = ANY (ARRAY[('NO GOOD LENGTH'::character varying)::text, ('BREAK'::character varying)::text, ('WEAK FIBER'::character varying)::text])))
);


ALTER TABLE public.pt_entry OWNER TO postgres;

--
-- Name: pt_entry_pt_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_entry_pt_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_entry_pt_entry_id_seq OWNER TO postgres;

--
-- Name: pt_entry_pt_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_entry_pt_entry_id_seq OWNED BY public.pt_entry.pt_entry_id;


--
-- Name: pt_flaw_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_flaw_details (
    pt_flaw_id integer NOT NULL,
    spool_id character varying(10) NOT NULL,
    reason text,
    pos1 numeric(10,3),
    pos2 numeric(10,3),
    defect_length numeric(10,2),
    actual_cutting numeric(10,2),
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_done boolean DEFAULT false,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    booked_at timestamp without time zone,
    missed_at timestamp without time zone,
    flaw_remark text,
    is_booked boolean DEFAULT false
);


ALTER TABLE public.pt_flaw_details OWNER TO postgres;

--
-- Name: pt_flaw_details_pt_flaw_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_flaw_details_pt_flaw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_flaw_details_pt_flaw_id_seq OWNER TO postgres;

--
-- Name: pt_flaw_details_pt_flaw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_flaw_details_pt_flaw_id_seq OWNED BY public.pt_flaw_details.pt_flaw_id;


--
-- Name: pt_machine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_machine (
    pt_machine_id integer NOT NULL,
    pt_machine_no integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pt_machine OWNER TO postgres;

--
-- Name: pt_machine_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_machine_logs (
    spool_code_tu character varying(100) NOT NULL,
    spool_code_po character varying(100),
    start_time time without time zone,
    end_time time without time zone,
    operator character varying(100),
    set_length integer,
    real_length integer,
    machine_stop_reason_t text,
    start_date date,
    end_date date,
    run_speed integer,
    machine_total_time integer,
    machine_total_length integer,
    idle_time interval,
    runtime interval,
    processed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    machine_number character varying(10) NOT NULL
);


ALTER TABLE public.pt_machine_logs OWNER TO postgres;

--
-- Name: pt_machine_pt_machine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_machine_pt_machine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_machine_pt_machine_id_seq OWNER TO postgres;

--
-- Name: pt_machine_pt_machine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_machine_pt_machine_id_seq OWNED BY public.pt_machine.pt_machine_id;


--
-- Name: pt_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_users (
    pt_user_id integer NOT NULL,
    emp_id character varying(20),
    pt_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pt_users OWNER TO postgres;

--
-- Name: pt_users_pt_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_users_pt_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_users_pt_user_id_seq OWNER TO postgres;

--
-- Name: pt_users_pt_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_users_pt_user_id_seq OWNED BY public.pt_users.pt_user_id;


--
-- Name: pv_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pv_entries (
    pv_entry_id integer NOT NULL,
    pv_type character varying(50) NOT NULL,
    pv_operator character varying(100) NOT NULL,
    shift character varying(10) NOT NULL,
    pv_date date DEFAULT CURRENT_DATE NOT NULL,
    pv_time time without time zone DEFAULT CURRENT_TIME NOT NULL,
    pv_remark text,
    bobbin_no character varying(50) CONSTRAINT pv_entries_bobbin_id_not_null NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    spool_fid character varying(50) NOT NULL,
    spool_id character varying(100),
    preform_id character varying(100),
    fiber_type character varying(50),
    colour character varying(50),
    qty_kms numeric(10,3),
    logged_in_user character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pv_entries OWNER TO postgres;

--
-- Name: pv_entries_pv_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pv_entries_pv_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pv_entries_pv_entry_id_seq OWNER TO postgres;

--
-- Name: pv_entries_pv_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pv_entries_pv_entry_id_seq OWNED BY public.pv_entries.pv_entry_id;


--
-- Name: qc_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_entry (
    bobbin_no character varying(10) NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    product_type character varying(50),
    avg_lsa_atn_1310 numeric(10,3),
    avg_lsa_atn_1550 numeric(10,3),
    avg_lsa_atn_1625 numeric(10,3),
    avg_lsa_atn_1383 numeric(10,3),
    max_lsa_atn_1310 numeric(10,3),
    max_lsa_atn_1550 numeric(10,3),
    max_lsa_atn_1625 numeric(10,3),
    max_lsa_atn_1383 numeric(10,3),
    min_lsa_atn_1310 numeric(10,3),
    min_lsa_atn_1550 numeric(10,3),
    min_lsa_atn_1625 numeric(10,3),
    min_lsa_atn_1383 numeric(10,3),
    atn_1310_top numeric(10,3),
    atn_1550_top numeric(10,3),
    atn_1625_top numeric(10,3),
    atn_1383_top numeric(10,3),
    atn_1310_bottom numeric(10,3),
    atn_1550_bottom numeric(10,3),
    atn_1625_bottom numeric(10,3),
    atn_1383_bottom numeric(10,3),
    max_atn_1310_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    max_tb_1310 numeric(10,3),
    max_tb_1550 numeric(10,3),
    max_tb_1625 numeric(10,3),
    max_tb_1383 numeric(10,3),
    atn_1310_tb numeric(10,3),
    atn_1550_tb numeric(10,3),
    atn_1625_tb numeric(10,3),
    atn_1383_tb numeric(10,3),
    atn_uniformity_1310 numeric(10,3),
    atn_uniformity_1550 numeric(10,3),
    atn_uniformity_1625 numeric(10,3),
    atn_uniformity_1383 numeric(10,3),
    mfd_uniformity_1310 numeric(10,3),
    mfd_uniformity_1550 numeric(10,3),
    mfd_uniformity_1625 numeric(10,3),
    mfd_uniformity_1383 numeric(10,3),
    step_1310_size numeric(10,3),
    step_1550_size numeric(10,3),
    step_1625_size numeric(10,3),
    step_1383_size numeric(10,3),
    spike_1310_size numeric(10,3),
    spike_1550_size numeric(10,3),
    spike_1625_size numeric(10,3),
    spike_1383_size numeric(10,3),
    spec_1310 numeric(10,3),
    spec_1550 numeric(10,3),
    spec_1285_1330 numeric(10,3),
    mfd_1310_top numeric(10,3),
    mfd_1310_bottom numeric(10,3),
    mfd_1550_top numeric(10,3),
    mfd_1550_bottom numeric(10,3),
    effective_area_1310 numeric(10,3),
    effective_area_1550 numeric(10,3),
    cut_off_top numeric(10,3),
    cut_off_bottom numeric(10,3),
    cable_cut_off numeric(10,3),
    mac_value numeric(10,3),
    clad_dia_top numeric(10,3),
    clad_dia_bottom numeric(10,3),
    core_clad_concentricity_top numeric(10,3),
    core_clad_concentricity_bottom numeric(10,3),
    clad_ovality_top numeric(10,3),
    clad_ovality_bottom numeric(10,3),
    core_dia_top numeric(10,3),
    core_dia_bottom numeric(10,3),
    core_ovality_top numeric(10,3),
    core_ovality_bottom numeric(10,3),
    primary_coating_dia_top numeric(10,3),
    primary_coating_dia_bottom numeric(10,3),
    secondary_coating_dia_top numeric(10,3),
    secondary_coating_dia_bottom numeric(10,3),
    primary_coating_concentricity_top numeric(10,3),
    primary_coating_concentricity_bottom numeric(10,3),
    secondary_coating_concentricity_top numeric(10,3),
    secondary_coating_concentricity_bottom numeric(10,3),
    coating_ovality_top numeric(10,3),
    coating_ovality_bottom numeric(10,3),
    fiber_curl_top numeric(10,3),
    fiber_curl_bottom numeric(10,3),
    curl_defection_top numeric(10,3),
    curl_defection_bottom numeric(10,3),
    zero_disp_wave numeric(10,3),
    slope_zero_disp numeric(10,3),
    disp_1550 numeric(10,3),
    disp_1285_1330 numeric(10,3),
    disp_1270_1340 numeric(10,3),
    disp_1575 numeric(10,3),
    cd_1460 numeric(10,3),
    disp_1625 numeric(10,3),
    disp_1570 numeric(10,3),
    disp_1260 numeric(10,3),
    pmd_1310 numeric(10,3),
    pmd_1550 numeric(10,3),
    disp_slope numeric(10,3),
    m_100t_50mm_1550 numeric(10,3),
    m_100t_50mm_1310 numeric(10,3),
    m_100t_50mm_1625 numeric(10,3),
    m_100t_60mm_1550 numeric(10,3),
    m_100t_60mm_1310 numeric(10,3),
    m_100t_60mm_1625 numeric(10,3),
    m_1t_32mm_1550 numeric(10,3),
    m_1t_32mm_1310 numeric(10,3),
    m_1t_32mm_1625 numeric(10,3),
    m_10t_30mm_1550 numeric(10,3),
    m_10t_30mm_1310 numeric(10,3),
    m_10t_30mm_1625 numeric(10,3),
    m_1t_20mm_1550 numeric(10,3),
    m_1t_20mm_1310 numeric(10,3),
    m_1t_20mm_1625 numeric(10,3),
    m_1t_15mm_1550 numeric(10,3),
    m_1t_15mm_1310 numeric(10,3),
    m_1t_15mm_1625 numeric(10,3),
    m_1t_10mm_1550 numeric(10,3),
    m_1t_10mm_1310 numeric(10,3),
    m_1t_10mm_1625 numeric(10,3),
    temp_grade character varying(50),
    final_grade character varying(50),
    optical_length numeric(10,3),
    status character varying(20),
    reason character varying(20),
    remark character varying(300),
    is_rew_done boolean DEFAULT false,
    otdr_test_date character varying(100),
    nc_cause character varying(100),
    otdr_operator character varying(100),
    otdr_machine character varying(100),
    disp_1270_1360 numeric(10,3),
    disp_1460 numeric(10,3),
    disp_1490 numeric(10,3),
    slope_1550 numeric(10,3),
    slope_1290 numeric(10,3),
    slope_1490 numeric(10,3)
);


ALTER TABLE public.qc_entry OWNER TO postgres;

--
-- Name: qc_entry_temp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_entry_temp (
    bobbin_no character varying(10) NOT NULL,
    bobbin_fid character varying(50),
    product_type character varying(50),
    avg_lsa_atn_1310 numeric(10,3),
    avg_lsa_atn_1550 numeric(10,3),
    avg_lsa_atn_1625 numeric(10,3),
    avg_lsa_atn_1383 numeric(10,3),
    max_lsa_atn_1310 numeric(10,3),
    max_lsa_atn_1550 numeric(10,3),
    max_lsa_atn_1625 numeric(10,3),
    max_lsa_atn_1383 numeric(10,3),
    min_lsa_atn_1310 numeric(10,3),
    min_lsa_atn_1550 numeric(10,3),
    min_lsa_atn_1625 numeric(10,3),
    min_lsa_atn_1383 numeric(10,3),
    atn_1310_top numeric(10,3),
    atn_1550_top numeric(10,3),
    atn_1625_top numeric(10,3),
    atn_1383_top numeric(10,3),
    atn_1310_bottom numeric(10,3),
    atn_1550_bottom numeric(10,3),
    atn_1625_bottom numeric(10,3),
    atn_1383_bottom numeric(10,3),
    max_atn_1310_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    max_tb_1310 numeric(10,3),
    max_tb_1550 numeric(10,3),
    max_tb_1625 numeric(10,3),
    max_tb_1383 numeric(10,3),
    atn_1310_tb numeric(10,3),
    atn_1550_tb numeric(10,3),
    atn_1625_tb numeric(10,3),
    atn_1383_tb numeric(10,3),
    atn_uniformity_1310 numeric(10,3),
    atn_uniformity_1550 numeric(10,3),
    atn_uniformity_1625 numeric(10,3),
    atn_uniformity_1383 numeric(10,3),
    mfd_uniformity_1310 numeric(10,3),
    mfd_uniformity_1550 numeric(10,3),
    mfd_uniformity_1625 numeric(10,3),
    mfd_uniformity_1383 numeric(10,3),
    step_1310_size numeric(10,3),
    step_1550_size numeric(10,3),
    step_1625_size numeric(10,3),
    step_1383_size numeric(10,3),
    spike_1310_size numeric(10,3),
    spike_1550_size numeric(10,3),
    spike_1625_size numeric(10,3),
    spike_1383_size numeric(10,3),
    spec_1310 numeric(10,3),
    spec_1550 numeric(10,3),
    spec_1285_1330 numeric(10,3),
    mfd_1310_top numeric(10,3),
    mfd_1310_bottom numeric(10,3),
    mfd_1550_top numeric(10,3),
    mfd_1550_bottom numeric(10,3),
    effective_area_1310 numeric(10,3),
    effective_area_1550 numeric(10,3),
    cut_off_top numeric(10,3),
    cut_off_bottom numeric(10,3),
    cable_cut_off numeric(10,3),
    mac_value numeric(10,3),
    clad_dia_top numeric(10,3),
    clad_dia_bottom numeric(10,3),
    core_clad_concentricity_top numeric(10,3),
    core_clad_concentricity_bottom numeric(10,3),
    clad_ovality_top numeric(10,3),
    clad_ovality_bottom numeric(10,3),
    core_dia_top numeric(10,3),
    core_dia_bottom numeric(10,3),
    core_ovality_top numeric(10,3),
    core_ovality_bottom numeric(10,3),
    primary_coating_dia_top numeric(10,3),
    primary_coating_dia_bottom numeric(10,3),
    secondary_coating_dia_top numeric(10,3),
    secondary_coating_dia_bottom numeric(10,3),
    primary_coating_concentricity_top numeric(10,3),
    primary_coating_concentricity_bottom numeric(10,3),
    secondary_coating_concentricity_top numeric(10,3),
    secondary_coating_concentricity_bottom numeric(10,3),
    coating_ovality_top numeric(10,3),
    coating_ovality_bottom numeric(10,3),
    fiber_curl_top numeric(10,3),
    fiber_curl_bottom numeric(10,3),
    curl_defection_top numeric(10,3),
    curl_defection_bottom numeric(10,3),
    zero_disp_wave numeric(10,3),
    slope_zero_disp numeric(10,3),
    disp_1550 numeric(10,3),
    disp_1285_1330 numeric(10,3),
    disp_1270_1340 numeric(10,3),
    disp_1575 numeric(10,3),
    cd_1460 numeric(10,3),
    disp_1625 numeric(10,3),
    disp_1570 numeric(10,3),
    disp_1260 numeric(10,3),
    pmd_1310 numeric(10,3),
    pmd_1550 numeric(10,3),
    disp_slope numeric(10,3),
    m_100t_50mm_1550 numeric(10,3),
    m_100t_50mm_1310 numeric(10,3),
    m_100t_50mm_1625 numeric(10,3),
    m_100t_60mm_1550 numeric(10,3),
    m_100t_60mm_1310 numeric(10,3),
    m_100t_60mm_1625 numeric(10,3),
    m_1t_32mm_1550 numeric(10,3),
    m_1t_32mm_1310 numeric(10,3),
    m_1t_32mm_1625 numeric(10,3),
    m_10t_30mm_1550 numeric(10,3),
    m_10t_30mm_1310 numeric(10,3),
    m_10t_30mm_1625 numeric(10,3),
    m_1t_20mm_1550 numeric(10,3),
    m_1t_20mm_1310 numeric(10,3),
    m_1t_20mm_1625 numeric(10,3),
    m_1t_15mm_1550 numeric(10,3),
    m_1t_15mm_1310 numeric(10,3),
    m_1t_15mm_1625 numeric(10,3),
    m_1t_10mm_1550 numeric(10,3),
    m_1t_10mm_1310 numeric(10,3),
    m_1t_10mm_1625 numeric(10,3),
    temp_grade character varying(50),
    final_grade character varying(50),
    optical_length numeric(10,3),
    status character varying(20),
    reason character varying(20),
    remark character varying(300),
    is_rew_done boolean DEFAULT false,
    otdr_test_date character varying(100),
    nc_cause character varying(100),
    otdr_operator character varying(100),
    otdr_machine character varying(100),
    disp_1270_1360 numeric(10,3),
    disp_1460 numeric(10,3),
    disp_1490 numeric(10,3),
    slope_1550 numeric(10,3),
    slope_1290 numeric(10,3),
    slope_1490 numeric(10,3)
);


ALTER TABLE public.qc_entry_temp OWNER TO postgres;

--
-- Name: qc_grade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_grade (
    qc_entry_id integer NOT NULL,
    grade character varying(20),
    product_type character varying(50),
    priority integer,
    status boolean,
    min_avg_lsa_atn_1310 numeric(10,3),
    max_avg_lsa_atn_1310 numeric(10,3),
    min_avg_lsa_atn_1550 numeric(10,3),
    max_avg_lsa_atn_1550 numeric(10,3),
    min_avg_lsa_atn_1625 numeric(10,3),
    max_avg_lsa_atn_1625 numeric(10,3),
    min_avg_lsa_atn_1383 numeric(10,3),
    max_avg_lsa_atn_1383 numeric(10,3),
    min_max_lsa_atn_1310 numeric(10,3),
    max_max_lsa_atn_1310 numeric(10,3),
    min_max_lsa_atn_1550 numeric(10,3),
    max_max_lsa_atn_1550 numeric(10,3),
    min_max_lsa_atn_1625 numeric(10,3),
    max_max_lsa_atn_1625 numeric(10,3),
    min_max_lsa_atn_1383 numeric(10,3),
    max_max_lsa_atn_1383 numeric(10,3),
    min_min_lsa_atn_1310 numeric(10,3),
    max_min_lsa_atn_1310 numeric(10,3),
    min_min_lsa_atn_1550 numeric(10,3),
    max_min_lsa_atn_1550 numeric(10,3),
    min_min_lsa_atn_1625 numeric(10,3),
    max_min_lsa_atn_1625 numeric(10,3),
    min_min_lsa_atn_1383 numeric(10,3),
    max_min_lsa_atn_1383 numeric(10,3),
    min_atn_1310_top numeric(10,3),
    max_atn_1310_top numeric(10,3),
    min_atn_1550_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    min_atn_1625_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    min_atn_1383_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    min_atn_1310_bottom numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    min_atn_1550_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    min_atn_1625_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    min_atn_1383_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    min_max_atn_1310_top numeric(10,3),
    max_max_atn_1310_top numeric(10,3),
    min_max_atn_1550_top numeric(10,3),
    max_max_atn_1550_top numeric(10,3),
    min_max_atn_1625_top numeric(10,3),
    max_max_atn_1625_top numeric(10,3),
    min_max_atn_1383_top numeric(10,3),
    max_max_atn_1383_top numeric(10,3),
    min_max_atn_1310_bottom numeric(10,3),
    max_max_atn_1310_bottom numeric(10,3),
    min_max_atn_1550_bottom numeric(10,3),
    max_max_atn_1550_bottom numeric(10,3),
    min_max_atn_1625_bottom numeric(10,3),
    max_max_atn_1625_bottom numeric(10,3),
    min_max_atn_1383_bottom numeric(10,3),
    max_max_atn_1383_bottom numeric(10,3),
    min_max_tb_1310 numeric(10,3),
    max_max_tb_1310 numeric(10,3),
    min_max_tb_1550 numeric(10,3),
    max_max_tb_1550 numeric(10,3),
    min_max_tb_1625 numeric(10,3),
    max_max_tb_1625 numeric(10,3),
    min_max_tb_1383 numeric(10,3),
    max_max_tb_1383 numeric(10,3),
    min_atn_1310_tb numeric(10,3),
    max_atn_1310_tb numeric(10,3),
    min_atn_1550_tb numeric(10,3),
    max_atn_1550_tb numeric(10,3),
    min_atn_1625_tb numeric(10,3),
    max_atn_1625_tb numeric(10,3),
    min_atn_1383_tb numeric(10,3),
    max_atn_1383_tb numeric(10,3),
    min_atn_uniformity_1310 numeric(10,3),
    max_atn_uniformity_1310 numeric(10,3),
    min_atn_uniformity_1550 numeric(10,3),
    max_atn_uniformity_1550 numeric(10,3),
    min_atn_uniformity_1625 numeric(10,3),
    max_atn_uniformity_1625 numeric(10,3),
    min_atn_uniformity_1383 numeric(10,3),
    max_atn_uniformity_1383 numeric(10,3),
    min_mfd_uniformity_1310 numeric(10,3),
    max_mfd_uniformity_1310 numeric(10,3),
    min_mfd_uniformity_1550 numeric(10,3),
    max_mfd_uniformity_1550 numeric(10,3),
    min_mfd_uniformity_1625 numeric(10,3),
    max_mfd_uniformity_1625 numeric(10,3),
    min_mfd_uniformity_1383 numeric(10,3),
    max_mfd_uniformity_1383 numeric(10,3),
    min_step_1310_size numeric(10,3),
    max_step_1310_size numeric(10,3),
    min_step_1550_size numeric(10,3),
    max_step_1550_size numeric(10,3),
    min_step_1625_size numeric(10,3),
    max_step_1625_size numeric(10,3),
    min_step_1383_size numeric(10,3),
    max_step_1383_size numeric(10,3),
    min_spike_1310_size numeric(10,3),
    max_spike_1310_size numeric(10,3),
    min_spike_1550_size numeric(10,3),
    max_spike_1550_size numeric(10,3),
    min_spike_1625_size numeric(10,3),
    max_spike_1625_size numeric(10,3),
    min_spike_1383_size numeric(10,3),
    max_spike_1383_size numeric(10,3),
    min_spec_1310 numeric(10,3),
    max_spec_1310 numeric(10,3),
    min_spec_1550 numeric(10,3),
    max_spec_1550 numeric(10,3),
    min_spec_1285_1330 numeric(10,3),
    max_spec_1285_1330 numeric(10,3),
    min_mfd_1310_top numeric(10,3),
    max_mfd_1310_top numeric(10,3),
    min_mfd_1310_bottom numeric(10,3),
    max_mfd_1310_bottom numeric(10,3),
    min_mfd_1550_top numeric(10,3),
    max_mfd_1550_top numeric(10,3),
    min_mfd_1550_bottom numeric(10,3),
    max_mfd_1550_bottom numeric(10,3),
    min_effective_area_1310 numeric(10,3),
    max_effective_area_1310 numeric(10,3),
    min_effective_area_1550 numeric(10,3),
    max_effective_area_1550 numeric(10,3),
    min_cut_off_top numeric(10,3),
    max_cut_off_top numeric(10,3),
    min_cut_off_bottom numeric(10,3),
    max_cut_off_bottom numeric(10,3),
    min_cable_cut_off numeric(10,3),
    max_cable_cut_off numeric(10,3),
    min_mac_value numeric(10,3),
    max_mac_value numeric(10,3),
    min_clad_dia_top numeric(10,3),
    max_clad_dia_top numeric(10,3),
    min_clad_dia_bottom numeric(10,3),
    max_clad_dia_bottom numeric(10,3),
    min_core_clad_concentricity_top numeric(10,3),
    max_core_clad_concentricity_top numeric(10,3),
    min_core_clad_concentricity_bottom numeric(10,3),
    max_core_clad_concentricity_bottom numeric(10,3),
    min_clad_ovality_top numeric(10,3),
    max_clad_ovality_top numeric(10,3),
    min_clad_ovality_bottom numeric(10,3),
    max_clad_ovality_bottom numeric(10,3),
    min_core_dia_top numeric(10,3),
    max_core_dia_top numeric(10,3),
    min_core_dia_bottom numeric(10,3),
    max_core_dia_bottom numeric(10,3),
    min_core_ovality_top numeric(10,3),
    max_core_ovality_top numeric(10,3),
    min_core_ovality_bottom numeric(10,3),
    max_core_ovality_bottom numeric(10,3),
    min_primary_coating_dia_top numeric(10,3),
    max_primary_coating_dia_top numeric(10,3),
    min_primary_coating_dia_bottom numeric(10,3),
    max_primary_coating_dia_bottom numeric(10,3),
    min_secondary_coating_dia_top numeric(10,3),
    max_secondary_coating_dia_top numeric(10,3),
    min_secondary_coating_dia_bottom numeric(10,3),
    max_secondary_coating_dia_bottom numeric(10,3),
    min_primary_coating_concentricity_top numeric(10,3),
    max_primary_coating_concentricity_top numeric(10,3),
    min_primary_coating_concentricity_bottom numeric(10,3),
    max_primary_coating_concentricity_bottom numeric(10,3),
    min_secondary_coating_concentricity_top numeric(10,3),
    max_secondary_coating_concentricity_top numeric(10,3),
    min_secondary_coating_concentricity_bottom numeric(10,3),
    max_secondary_coating_concentricity_bottom numeric(10,3),
    min_coating_ovality_top numeric(10,3),
    max_coating_ovality_top numeric(10,3),
    min_coating_ovality_bottom numeric(10,3),
    max_coating_ovality_bottom numeric(10,3),
    min_fiber_curl_top numeric(10,3),
    max_fiber_curl_top numeric(10,3),
    min_fiber_curl_bottom numeric(10,3),
    max_fiber_curl_bottom numeric(10,3),
    min_curl_defection_top numeric(10,3),
    max_curl_defection_top numeric(10,3),
    min_curl_defection_bottom numeric(10,3),
    max_curl_defection_bottom numeric(10,3),
    min_zero_disp_wave numeric(10,3),
    max_zero_disp_wave numeric(10,3),
    min_slope_zero_disp numeric(10,3),
    max_slope_zero_disp numeric(10,3),
    min_disp_1550 numeric(10,3),
    max_disp_1550 numeric(10,3),
    min_disp_1285_1330 numeric(10,3),
    max_disp_1285_1330 numeric(10,3),
    min_disp_1270_1340 numeric(10,3),
    max_disp_1270_1340 numeric(10,3),
    min_disp_1575 numeric(10,3),
    max_disp_1575 numeric(10,3),
    min_cd_1460 numeric(10,3),
    max_cd_1460 numeric(10,3),
    min_disp_1625 numeric(10,3),
    max_disp_1625 numeric(10,3),
    min_disp_1570 numeric(10,3),
    max_disp_1570 numeric(10,3),
    min_disp_1260 numeric(10,3),
    max_disp_1260 numeric(10,3),
    min_pmd_1310 numeric(10,3),
    max_pmd_1310 numeric(10,3),
    min_pmd_1550 numeric(10,3),
    max_pmd_1550 numeric(10,3),
    min_disp_slope numeric(10,3),
    max_disp_slope numeric(10,3),
    min_m_100t_50mm_1550 numeric(10,3),
    max_m_100t_50mm_1550 numeric(10,3),
    min_m_100t_50mm_1310 numeric(10,3),
    max_m_100t_50mm_1310 numeric(10,3),
    min_m_100t_50mm_1625 numeric(10,3),
    max_m_100t_50mm_1625 numeric(10,3),
    min_m_100t_60mm_1550 numeric(10,3),
    max_m_100t_60mm_1550 numeric(10,3),
    min_m_100t_60mm_1310 numeric(10,3),
    max_m_100t_60mm_1310 numeric(10,3),
    min_m_100t_60mm_1625 numeric(10,3),
    max_m_100t_60mm_1625 numeric(10,3),
    min_m_1t_32mm_1550 numeric(10,3),
    max_m_1t_32mm_1550 numeric(10,3),
    min_m_1t_32mm_1310 numeric(10,3),
    max_m_1t_32mm_1310 numeric(10,3),
    min_m_1t_32mm_1625 numeric(10,3),
    max_m_1t_32mm_1625 numeric(10,3),
    min_m_10t_30mm_1550 numeric(10,3),
    max_m_10t_30mm_1550 numeric(10,3),
    min_m_10t_30mm_1310 numeric(10,3),
    max_m_10t_30mm_1310 numeric(10,3),
    min_m_10t_30mm_1625 numeric(10,3),
    max_m_10t_30mm_1625 numeric(10,3),
    min_m_1t_20mm_1550 numeric(10,3),
    max_m_1t_20mm_1550 numeric(10,3),
    min_m_1t_20mm_1310 numeric(10,3),
    max_m_1t_20mm_1310 numeric(10,3),
    min_m_1t_20mm_1625 numeric(10,3),
    max_m_1t_20mm_1625 numeric(10,3),
    min_m_1t_15mm_1550 numeric(10,3),
    max_m_1t_15mm_1550 numeric(10,3),
    min_m_1t_15mm_1310 numeric(10,3),
    max_m_1t_15mm_1310 numeric(10,3),
    min_m_1t_15mm_1625 numeric(10,3),
    max_m_1t_15mm_1625 numeric(10,3),
    min_m_1t_10mm_1550 numeric(10,3),
    max_m_1t_10mm_1550 numeric(10,3),
    min_m_1t_10mm_1310 numeric(10,3),
    max_m_1t_10mm_1310 numeric(10,3),
    min_m_1t_10mm_1625 numeric(10,3),
    max_m_1t_10mm_1625 numeric(10,3),
    min_disp_1270_1360 numeric(10,3),
    max_disp_1270_1360 numeric(10,3),
    max_disp_1460 numeric(10,3),
    min_disp_1460 numeric(10,3),
    min_disp_1490 numeric(10,3),
    max_disp_1490 numeric(10,3),
    max_slope_1550 numeric(10,3),
    min_slope_1550 numeric(10,3),
    min_slope_1290 numeric(10,3),
    max_slope_1290 numeric(10,3),
    max_slope_1490 numeric(10,3),
    min_slope_1490 numeric(10,3),
    max_optical_length numeric(10,3),
    min_optical_length numeric(10,3),
    color_type character varying(10),
    CONSTRAINT qc_grade_color_type_check CHECK (((color_type)::text = ANY (ARRAY[('NATURAL'::character varying)::text, ('RM'::character varying)::text, ('COLORED'::character varying)::text])))
);


ALTER TABLE public.qc_grade OWNER TO postgres;

--
-- Name: qc_grade_qc_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qc_grade_qc_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qc_grade_qc_entry_id_seq OWNER TO postgres;

--
-- Name: qc_grade_qc_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qc_grade_qc_entry_id_seq OWNED BY public.qc_grade.qc_entry_id;


--
-- Name: qc_out; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_out (
    qc_out_id integer NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    out_date date NOT NULL,
    out_time time without time zone NOT NULL,
    "user" character varying(50) NOT NULL,
    shift character varying(10) NOT NULL,
    fiber_length numeric(10,3) NOT NULL,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qc_out OWNER TO postgres;

--
-- Name: qc_out_qc_out_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qc_out_qc_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qc_out_qc_out_id_seq OWNER TO postgres;

--
-- Name: qc_out_qc_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qc_out_qc_out_id_seq OWNED BY public.qc_out.qc_out_id;


--
-- Name: qc_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_users (
    qc_user_id integer NOT NULL,
    emp_id character varying(20),
    qc_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qc_users OWNER TO postgres;

--
-- Name: qc_users_qc_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qc_users_qc_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qc_users_qc_user_id_seq OWNER TO postgres;

--
-- Name: qc_users_qc_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qc_users_qc_user_id_seq OWNED BY public.qc_users.qc_user_id;


--
-- Name: report_execution_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_execution_log (
    id integer NOT NULL,
    report_id integer,
    executed_by integer,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms integer,
    row_count integer,
    filters_applied jsonb,
    status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    ip_address character varying(50)
);


ALTER TABLE public.report_execution_log OWNER TO postgres;

--
-- Name: report_execution_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_execution_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_execution_log_id_seq OWNER TO postgres;

--
-- Name: report_execution_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_execution_log_id_seq OWNED BY public.report_execution_log.id;


--
-- Name: report_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_master (
    id integer NOT NULL,
    report_name character varying(255) NOT NULL,
    description text,
    module character varying(100),
    status character varying(20) DEFAULT 'active'::character varying,
    main_table character varying(255) NOT NULL,
    columns jsonb DEFAULT '[]'::jsonb,
    column_display_names jsonb DEFAULT '{}'::jsonb,
    column_order jsonb DEFAULT '[]'::jsonb,
    joins jsonb DEFAULT '[]'::jsonb,
    expressions jsonb DEFAULT '[]'::jsonb,
    filters jsonb DEFAULT '[]'::jsonb,
    sorting jsonb DEFAULT '[]'::jsonb,
    group_by jsonb DEFAULT '[]'::jsonb,
    aggregates jsonb DEFAULT '[]'::jsonb,
    "having" jsonb DEFAULT '[]'::jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    updated_at timestamp without time zone,
    deleted_by integer,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version integer DEFAULT 1,
    is_multi_sheet boolean DEFAULT false
);


ALTER TABLE public.report_master OWNER TO postgres;

--
-- Name: report_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_master_id_seq OWNER TO postgres;

--
-- Name: report_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_master_id_seq OWNED BY public.report_master.id;


--
-- Name: report_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_permissions (
    id integer NOT NULL,
    report_id integer,
    permission_type character varying(10) NOT NULL,
    entity_id character varying(100) NOT NULL,
    entity_name character varying(255),
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_export boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_permissions OWNER TO postgres;

--
-- Name: report_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_permissions_id_seq OWNER TO postgres;

--
-- Name: report_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_permissions_id_seq OWNED BY public.report_permissions.id;


--
-- Name: report_saved_filters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_saved_filters (
    id integer NOT NULL,
    report_id integer,
    user_id integer,
    filter_name character varying(255) NOT NULL,
    filter_values jsonb NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_saved_filters OWNER TO postgres;

--
-- Name: report_saved_filters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_saved_filters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_saved_filters_id_seq OWNER TO postgres;

--
-- Name: report_saved_filters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_saved_filters_id_seq OWNED BY public.report_saved_filters.id;


--
-- Name: report_section_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_section_mapping (
    mapping_id integer NOT NULL,
    report_id integer NOT NULL,
    section_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_section_mapping OWNER TO postgres;

--
-- Name: report_section_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_section_mapping_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_section_mapping_mapping_id_seq OWNER TO postgres;

--
-- Name: report_section_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_section_mapping_mapping_id_seq OWNED BY public.report_section_mapping.mapping_id;


--
-- Name: report_section_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_section_master (
    section_id integer NOT NULL,
    section_key character varying(50) NOT NULL,
    section_name character varying(100) NOT NULL,
    display_order integer DEFAULT 0,
    disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_section_master OWNER TO postgres;

--
-- Name: report_section_master_section_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_section_master_section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_section_master_section_id_seq OWNER TO postgres;

--
-- Name: report_section_master_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_section_master_section_id_seq OWNED BY public.report_section_master.section_id;


--
-- Name: report_sheets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_sheets (
    id integer NOT NULL,
    report_id integer NOT NULL,
    sheet_name character varying(100) NOT NULL,
    display_order integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.report_sheets OWNER TO postgres;

--
-- Name: report_sheets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_sheets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_sheets_id_seq OWNER TO postgres;

--
-- Name: report_sheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_sheets_id_seq OWNED BY public.report_sheets.id;


--
-- Name: report_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_tables (
    id integer NOT NULL,
    sheet_id integer NOT NULL,
    report_id integer NOT NULL,
    table_name character varying(255) NOT NULL,
    main_table character varying(255) NOT NULL,
    columns jsonb DEFAULT '[]'::jsonb,
    column_display_names jsonb DEFAULT '{}'::jsonb,
    column_order jsonb DEFAULT '[]'::jsonb,
    joins jsonb DEFAULT '[]'::jsonb,
    expressions jsonb DEFAULT '[]'::jsonb,
    filters jsonb DEFAULT '[]'::jsonb,
    sorting jsonb DEFAULT '[]'::jsonb,
    group_by jsonb DEFAULT '[]'::jsonb,
    aggregates jsonb DEFAULT '[]'::jsonb,
    "having" jsonb DEFAULT '[]'::jsonb,
    display_order integer DEFAULT 1 NOT NULL,
    spacing integer DEFAULT 2,
    formatting jsonb DEFAULT '{"autoWidth": true, "headerBold": true, "borderEnabled": true, "headerBgColor": "#1e293b", "headerTextColor": "#ffffff"}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.report_tables OWNER TO postgres;

--
-- Name: report_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_tables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_tables_id_seq OWNER TO postgres;

--
-- Name: report_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_tables_id_seq OWNED BY public.report_tables.id;


--
-- Name: report_version_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_version_history (
    id integer NOT NULL,
    report_id integer,
    version integer NOT NULL,
    metadata jsonb NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    change_description text
);


ALTER TABLE public.report_version_history OWNER TO postgres;

--
-- Name: report_version_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_version_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_version_history_id_seq OWNER TO postgres;

--
-- Name: report_version_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_version_history_id_seq OWNED BY public.report_version_history.id;


--
-- Name: rew_machine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rew_machine (
    rew_machine_id integer NOT NULL,
    rew_machine_no character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rew_machine OWNER TO postgres;

--
-- Name: rew_machine_rew_machine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rew_machine_rew_machine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rew_machine_rew_machine_id_seq OWNER TO postgres;

--
-- Name: rew_machine_rew_machine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rew_machine_rew_machine_id_seq OWNED BY public.rew_machine.rew_machine_id;


--
-- Name: rewind_instr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewind_instr (
    rewind_instr_id integer NOT NULL,
    bobbin_no character varying(10),
    bobbin_fid character varying(50),
    p1 numeric(10,3),
    p2 numeric(10,3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    instruction character varying(100),
    is_done boolean DEFAULT false,
    logged_in_user character varying(50)
);


ALTER TABLE public.rewind_instr OWNER TO postgres;

--
-- Name: rewind_instr_rewind_instr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewind_instr_rewind_instr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewind_instr_rewind_instr_id_seq OWNER TO postgres;

--
-- Name: rewind_instr_rewind_instr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewind_instr_rewind_instr_id_seq OWNED BY public.rewind_instr.rewind_instr_id;


--
-- Name: rewinding_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewinding_entry (
    rewinding_id integer NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    fiber_length numeric(10,3),
    fid character varying(50),
    machine_no integer,
    rew_reason character varying(50),
    rew_type character varying(50),
    is_scrap boolean DEFAULT false,
    bobbin_type character varying(50),
    operator character varying(50),
    bobbin_colour character varying(50),
    remark text,
    logged_in_user character varying(50) NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_bobbin_no character varying(10)
);


ALTER TABLE public.rewinding_entry OWNER TO postgres;

--
-- Name: rewinding_entry_rewinding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewinding_entry_rewinding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewinding_entry_rewinding_id_seq OWNER TO postgres;

--
-- Name: rewinding_entry_rewinding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewinding_entry_rewinding_id_seq OWNED BY public.rewinding_entry.rewinding_id;


--
-- Name: sap_transaction_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sap_transaction_log (
    log_id bigint NOT NULL,
    operation character varying(50) NOT NULL,
    sap_endpoint character varying(255),
    sap_url text,
    http_method character varying(10) DEFAULT 'POST'::character varying,
    movement_type character varying(10),
    status character varying(10) NOT NULL,
    http_status_code integer,
    sap_status character varying(5),
    message text,
    reference_type character varying(50),
    reference_id character varying(100),
    material_document character varying(50),
    material_code character varying(50),
    batch character varying(100),
    inspection_lot character varying(50),
    prod_order character varying(50),
    correlation_id uuid,
    source_table character varying(50),
    source_ids integer[],
    request_payload jsonb,
    response_payload jsonb,
    error_detail text,
    triggered_by character varying(100),
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sap_transaction_log OWNER TO postgres;

--
-- Name: sap_transaction_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sap_transaction_log_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sap_transaction_log_log_id_seq OWNER TO postgres;

--
-- Name: sap_transaction_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sap_transaction_log_log_id_seq OWNED BY public.sap_transaction_log.log_id;


--
-- Name: scheduled_mails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduled_mails (
    id integer NOT NULL,
    provider character varying(10) NOT NULL,
    "to" character varying(500) NOT NULL,
    cc character varying(500),
    bcc character varying(500),
    subject character varying(500) NOT NULL,
    text text,
    html text,
    template_name character varying(100),
    template_vars jsonb,
    scheduled_at timestamp without time zone NOT NULL,
    recurrence character varying(20) DEFAULT 'once'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    last_sent_at timestamp without time zone,
    next_run_at timestamp without time zone,
    error_message text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT scheduled_mails_provider_check CHECK (((provider)::text = ANY ((ARRAY['gmail'::character varying, 'org'::character varying])::text[]))),
    CONSTRAINT scheduled_mails_recurrence_check CHECK (((recurrence)::text = ANY ((ARRAY['once'::character varying, 'daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::text[]))),
    CONSTRAINT scheduled_mails_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'cancelled'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.scheduled_mails OWNER TO postgres;

--
-- Name: scheduled_mails_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scheduled_mails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scheduled_mails_id_seq OWNER TO postgres;

--
-- Name: scheduled_mails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scheduled_mails_id_seq OWNED BY public.scheduled_mails.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    shift_id integer NOT NULL,
    shift_name character varying(20) NOT NULL,
    shift_start_time time without time zone NOT NULL,
    shift_end_time time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: shifts_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_shift_id_seq OWNER TO postgres;

--
-- Name: shifts_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_shift_id_seq OWNED BY public.shifts.shift_id;


--
-- Name: spec_mandatory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spec_mandatory (
    spec_mandatory_id integer NOT NULL,
    spec_id integer NOT NULL,
    product_type character varying(100) NOT NULL,
    mandatory_params jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.spec_mandatory OWNER TO postgres;

--
-- Name: spec_mandatory_spec_mandatory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.spec_mandatory_spec_mandatory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spec_mandatory_spec_mandatory_id_seq OWNER TO postgres;

--
-- Name: spec_mandatory_spec_mandatory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.spec_mandatory_spec_mandatory_id_seq OWNED BY public.spec_mandatory.spec_mandatory_id;


--
-- Name: spec_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spec_master (
    spec_id integer NOT NULL,
    customer_name character varying(200),
    po_number character varying(100),
    pt_strain character varying(100),
    cust_spec_name character varying(200),
    product_type character varying(100),
    coating_type character varying(100),
    quantity_km numeric(10,3),
    color character varying(100),
    priority integer DEFAULT 1,
    remarks text,
    is_active boolean DEFAULT true,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    min_avg_lsa_atn_1310 numeric(10,3),
    max_avg_lsa_atn_1310 numeric(10,3),
    min_avg_lsa_atn_1550 numeric(10,3),
    max_avg_lsa_atn_1550 numeric(10,3),
    min_avg_lsa_atn_1625 numeric(10,3),
    max_avg_lsa_atn_1625 numeric(10,3),
    min_avg_lsa_atn_1383 numeric(10,3),
    max_avg_lsa_atn_1383 numeric(10,3),
    min_max_lsa_atn_1310 numeric(10,3),
    max_max_lsa_atn_1310 numeric(10,3),
    min_max_lsa_atn_1550 numeric(10,3),
    max_max_lsa_atn_1550 numeric(10,3),
    min_max_lsa_atn_1625 numeric(10,3),
    max_max_lsa_atn_1625 numeric(10,3),
    min_max_lsa_atn_1383 numeric(10,3),
    max_max_lsa_atn_1383 numeric(10,3),
    min_min_lsa_atn_1310 numeric(10,3),
    max_min_lsa_atn_1310 numeric(10,3),
    min_min_lsa_atn_1550 numeric(10,3),
    max_min_lsa_atn_1550 numeric(10,3),
    min_min_lsa_atn_1625 numeric(10,3),
    max_min_lsa_atn_1625 numeric(10,3),
    min_min_lsa_atn_1383 numeric(10,3),
    max_min_lsa_atn_1383 numeric(10,3),
    min_atn_1310_top numeric(10,3),
    max_atn_1310_top numeric(10,3),
    min_atn_1550_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    min_atn_1625_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    min_atn_1383_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    min_atn_1310_bottom numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    min_atn_1550_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    min_atn_1625_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    min_atn_1383_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    min_max_atn_1310_top numeric(10,3),
    max_max_atn_1310_top numeric(10,3),
    min_max_atn_1550_top numeric(10,3),
    max_max_atn_1550_top numeric(10,3),
    min_max_atn_1625_top numeric(10,3),
    max_max_atn_1625_top numeric(10,3),
    min_max_atn_1383_top numeric(10,3),
    max_max_atn_1383_top numeric(10,3),
    min_max_atn_1310_bottom numeric(10,3),
    max_max_atn_1310_bottom numeric(10,3),
    min_max_atn_1550_bottom numeric(10,3),
    max_max_atn_1550_bottom numeric(10,3),
    min_max_atn_1625_bottom numeric(10,3),
    max_max_atn_1625_bottom numeric(10,3),
    min_max_atn_1383_bottom numeric(10,3),
    max_max_atn_1383_bottom numeric(10,3),
    min_max_tb_1310 numeric(10,3),
    max_max_tb_1310 numeric(10,3),
    min_max_tb_1550 numeric(10,3),
    max_max_tb_1550 numeric(10,3),
    min_max_tb_1625 numeric(10,3),
    max_max_tb_1625 numeric(10,3),
    min_max_tb_1383 numeric(10,3),
    max_max_tb_1383 numeric(10,3),
    min_atn_1310_tb numeric(10,3),
    max_atn_1310_tb numeric(10,3),
    min_atn_1550_tb numeric(10,3),
    max_atn_1550_tb numeric(10,3),
    min_atn_1625_tb numeric(10,3),
    max_atn_1625_tb numeric(10,3),
    min_atn_1383_tb numeric(10,3),
    max_atn_1383_tb numeric(10,3),
    min_atn_uniformity_1310 numeric(10,3),
    max_atn_uniformity_1310 numeric(10,3),
    min_atn_uniformity_1550 numeric(10,3),
    max_atn_uniformity_1550 numeric(10,3),
    min_atn_uniformity_1625 numeric(10,3),
    max_atn_uniformity_1625 numeric(10,3),
    min_atn_uniformity_1383 numeric(10,3),
    max_atn_uniformity_1383 numeric(10,3),
    min_mfd_uniformity_1310 numeric(10,3),
    max_mfd_uniformity_1310 numeric(10,3),
    min_mfd_uniformity_1550 numeric(10,3),
    max_mfd_uniformity_1550 numeric(10,3),
    min_mfd_uniformity_1625 numeric(10,3),
    max_mfd_uniformity_1625 numeric(10,3),
    min_mfd_uniformity_1383 numeric(10,3),
    max_mfd_uniformity_1383 numeric(10,3),
    min_step_1310_size numeric(10,3),
    max_step_1310_size numeric(10,3),
    min_step_1550_size numeric(10,3),
    max_step_1550_size numeric(10,3),
    min_step_1625_size numeric(10,3),
    max_step_1625_size numeric(10,3),
    min_step_1383_size numeric(10,3),
    max_step_1383_size numeric(10,3),
    min_spike_1310_size numeric(10,3),
    max_spike_1310_size numeric(10,3),
    min_spike_1550_size numeric(10,3),
    max_spike_1550_size numeric(10,3),
    min_spike_1625_size numeric(10,3),
    max_spike_1625_size numeric(10,3),
    min_spike_1383_size numeric(10,3),
    max_spike_1383_size numeric(10,3),
    min_spec_1310 numeric(10,3),
    max_spec_1310 numeric(10,3),
    min_spec_1550 numeric(10,3),
    max_spec_1550 numeric(10,3),
    min_spec_1285_1330 numeric(10,3),
    max_spec_1285_1330 numeric(10,3),
    min_mfd_1310_top numeric(10,3),
    max_mfd_1310_top numeric(10,3),
    min_mfd_1310_bottom numeric(10,3),
    max_mfd_1310_bottom numeric(10,3),
    min_mfd_1550_top numeric(10,3),
    max_mfd_1550_top numeric(10,3),
    min_mfd_1550_bottom numeric(10,3),
    max_mfd_1550_bottom numeric(10,3),
    min_effective_area_1310 numeric(10,3),
    max_effective_area_1310 numeric(10,3),
    min_effective_area_1550 numeric(10,3),
    max_effective_area_1550 numeric(10,3),
    min_cut_off_top numeric(10,3),
    max_cut_off_top numeric(10,3),
    min_cut_off_bottom numeric(10,3),
    max_cut_off_bottom numeric(10,3),
    min_cable_cut_off numeric(10,3),
    max_cable_cut_off numeric(10,3),
    min_mac_value numeric(10,3),
    max_mac_value numeric(10,3),
    min_clad_dia_top numeric(10,3),
    max_clad_dia_top numeric(10,3),
    min_clad_dia_bottom numeric(10,3),
    max_clad_dia_bottom numeric(10,3),
    min_core_clad_concentricity_top numeric(10,3),
    max_core_clad_concentricity_top numeric(10,3),
    min_core_clad_concentricity_bottom numeric(10,3),
    max_core_clad_concentricity_bottom numeric(10,3),
    min_clad_ovality_top numeric(10,3),
    max_clad_ovality_top numeric(10,3),
    min_clad_ovality_bottom numeric(10,3),
    max_clad_ovality_bottom numeric(10,3),
    min_core_dia_top numeric(10,3),
    max_core_dia_top numeric(10,3),
    min_core_dia_bottom numeric(10,3),
    max_core_dia_bottom numeric(10,3),
    min_core_ovality_top numeric(10,3),
    max_core_ovality_top numeric(10,3),
    min_core_ovality_bottom numeric(10,3),
    max_core_ovality_bottom numeric(10,3),
    min_primary_coating_dia_top numeric(10,3),
    max_primary_coating_dia_top numeric(10,3),
    min_primary_coating_dia_bottom numeric(10,3),
    max_primary_coating_dia_bottom numeric(10,3),
    min_secondary_coating_dia_top numeric(10,3),
    max_secondary_coating_dia_top numeric(10,3),
    min_secondary_coating_dia_bottom numeric(10,3),
    max_secondary_coating_dia_bottom numeric(10,3),
    min_primary_coating_concentricity_top numeric(10,3),
    max_primary_coating_concentricity_top numeric(10,3),
    min_primary_coating_concentricity_bottom numeric(10,3),
    max_primary_coating_concentricity_bottom numeric(10,3),
    min_secondary_coating_concentricity_top numeric(10,3),
    max_secondary_coating_concentricity_top numeric(10,3),
    min_secondary_coating_concentricity_bottom numeric(10,3),
    max_secondary_coating_concentricity_bottom numeric(10,3),
    min_coating_ovality_top numeric(10,3),
    max_coating_ovality_top numeric(10,3),
    min_coating_ovality_bottom numeric(10,3),
    max_coating_ovality_bottom numeric(10,3),
    min_fiber_curl_top numeric(10,3),
    max_fiber_curl_top numeric(10,3),
    min_fiber_curl_bottom numeric(10,3),
    max_fiber_curl_bottom numeric(10,3),
    min_curl_defection_top numeric(10,3),
    max_curl_defection_top numeric(10,3),
    min_curl_defection_bottom numeric(10,3),
    max_curl_defection_bottom numeric(10,3),
    min_zero_disp_wave numeric(10,3),
    max_zero_disp_wave numeric(10,3),
    min_slope_zero_disp numeric(10,3),
    max_slope_zero_disp numeric(10,3),
    min_disp_1550 numeric(10,3),
    max_disp_1550 numeric(10,3),
    min_disp_1285_1330 numeric(10,3),
    max_disp_1285_1330 numeric(10,3),
    min_disp_1270_1340 numeric(10,3),
    max_disp_1270_1340 numeric(10,3),
    min_disp_1575 numeric(10,3),
    max_disp_1575 numeric(10,3),
    min_cd_1460 numeric(10,3),
    max_cd_1460 numeric(10,3),
    min_disp_1625 numeric(10,3),
    max_disp_1625 numeric(10,3),
    min_disp_1570 numeric(10,3),
    max_disp_1570 numeric(10,3),
    min_disp_1260 numeric(10,3),
    max_disp_1260 numeric(10,3),
    min_pmd_1310 numeric(10,3),
    max_pmd_1310 numeric(10,3),
    min_pmd_1550 numeric(10,3),
    max_pmd_1550 numeric(10,3),
    min_disp_slope numeric(10,3),
    max_disp_slope numeric(10,3),
    min_m_100t_50mm_1550 numeric(10,3),
    max_m_100t_50mm_1550 numeric(10,3),
    min_m_100t_50mm_1310 numeric(10,3),
    max_m_100t_50mm_1310 numeric(10,3),
    min_m_100t_50mm_1625 numeric(10,3),
    max_m_100t_50mm_1625 numeric(10,3),
    min_m_100t_60mm_1550 numeric(10,3),
    max_m_100t_60mm_1550 numeric(10,3),
    min_m_100t_60mm_1310 numeric(10,3),
    max_m_100t_60mm_1310 numeric(10,3),
    min_m_100t_60mm_1625 numeric(10,3),
    max_m_100t_60mm_1625 numeric(10,3),
    min_m_1t_32mm_1550 numeric(10,3),
    max_m_1t_32mm_1550 numeric(10,3),
    min_m_1t_32mm_1310 numeric(10,3),
    max_m_1t_32mm_1310 numeric(10,3),
    min_m_1t_32mm_1625 numeric(10,3),
    max_m_1t_32mm_1625 numeric(10,3),
    min_m_10t_30mm_1550 numeric(10,3),
    max_m_10t_30mm_1550 numeric(10,3),
    min_m_10t_30mm_1310 numeric(10,3),
    max_m_10t_30mm_1310 numeric(10,3),
    min_m_10t_30mm_1625 numeric(10,3),
    max_m_10t_30mm_1625 numeric(10,3),
    min_m_1t_20mm_1550 numeric(10,3),
    max_m_1t_20mm_1550 numeric(10,3),
    min_m_1t_20mm_1310 numeric(10,3),
    max_m_1t_20mm_1310 numeric(10,3),
    min_m_1t_20mm_1625 numeric(10,3),
    max_m_1t_20mm_1625 numeric(10,3),
    min_m_1t_15mm_1550 numeric(10,3),
    max_m_1t_15mm_1550 numeric(10,3),
    min_m_1t_15mm_1310 numeric(10,3),
    max_m_1t_15mm_1310 numeric(10,3),
    min_m_1t_15mm_1625 numeric(10,3),
    max_m_1t_15mm_1625 numeric(10,3),
    min_m_1t_10mm_1550 numeric(10,3),
    max_m_1t_10mm_1550 numeric(10,3),
    min_m_1t_10mm_1310 numeric(10,3),
    max_m_1t_10mm_1310 numeric(10,3),
    min_m_1t_10mm_1625 numeric(10,3),
    max_m_1t_10mm_1625 numeric(10,3),
    min_disp_1270_1360 numeric(10,3),
    max_disp_1270_1360 numeric(10,3),
    min_disp_1460 numeric(10,3),
    max_disp_1460 numeric(10,3),
    min_disp_1490 numeric(10,3),
    max_disp_1490 numeric(10,3),
    min_slope_1550 numeric(10,3),
    max_slope_1550 numeric(10,3),
    min_slope_1290 numeric(10,3),
    max_slope_1290 numeric(10,3),
    min_slope_1490 numeric(10,3),
    max_slope_1490 numeric(10,3),
    preform_vendor_id character varying(50),
    color_type character varying(20),
    fiber_color character varying(50),
    allocation_ratio numeric(3,1),
    minimum_length numeric(5,1),
    customer_type character varying(10),
    CONSTRAINT chk_color_type CHECK (((color_type)::text = ANY (ARRAY[('NATURAL'::character varying)::text, ('COLORED'::character varying)::text, ('RM'::character varying)::text]))),
    CONSTRAINT spec_master_customer_type_check CHECK (((customer_type)::text = ANY ((ARRAY['INTERNAL'::character varying, 'EXTERNAL'::character varying])::text[])))
);


ALTER TABLE public.spec_master OWNER TO postgres;

--
-- Name: spec_master_spec_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.spec_master_spec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spec_master_spec_id_seq OWNER TO postgres;

--
-- Name: spec_master_spec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.spec_master_spec_id_seq OWNED BY public.spec_master.spec_id;


--
-- Name: splicing_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.splicing_entry (
    splicing_id integer NOT NULL,
    bobbin_a_no character varying(50),
    bobbin_b_no character varying(50),
    machine_loss numeric(10,3),
    product_type character varying(50),
    brand_name character varying(50),
    remark text,
    a_1310 numeric(10,3),
    a_1550 numeric(10,3),
    a_1625 numeric(10,3),
    b_1310 numeric(10,3),
    b_1550 numeric(10,3),
    b_1625 numeric(10,3),
    ave_loss_1310 numeric(10,3),
    ave_loss_1550 numeric(10,3),
    ave_loss_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.splicing_entry OWNER TO postgres;

--
-- Name: splicing_entry_splicing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.splicing_entry_splicing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.splicing_entry_splicing_id_seq OWNER TO postgres;

--
-- Name: splicing_entry_splicing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.splicing_entry_splicing_id_seq OWNED BY public.splicing_entry.splicing_id;


--
-- Name: tc_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tc_detail (
    tc_detail_id integer NOT NULL,
    tc_id integer NOT NULL,
    bobbin_no character varying(10) NOT NULL,
    bobbin_fid character varying(50),
    length_km numeric(10,3),
    box_no character varying(50),
    stack_no character varying(50),
    qc_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.tc_detail OWNER TO postgres;

--
-- Name: tc_detail_tc_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tc_detail_tc_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tc_detail_tc_detail_id_seq OWNER TO postgres;

--
-- Name: tc_detail_tc_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tc_detail_tc_detail_id_seq OWNED BY public.tc_detail.tc_detail_id;


--
-- Name: tc_header; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tc_header (
    tc_id integer NOT NULL,
    packing_order character varying(100) NOT NULL,
    tc_number character varying(100) NOT NULL,
    tc_date date,
    customer_ref character varying(255),
    inspection_date date,
    inspection_by character varying(100),
    approved_by character varying(100),
    remarks text,
    revision character varying(20) DEFAULT '0'::character varying,
    version character varying(20) DEFAULT '1.0'::character varying,
    total_km numeric(12,3),
    total_bobbins integer,
    mb_1turn text,
    mb_10turn text,
    mech_proof text,
    mech_coat text,
    mech_aged text,
    mech_unaged text,
    env_temp text,
    env_thc text,
    env_htha text,
    env_water text,
    env_accel text,
    opc_egir text,
    opc_attn1 text,
    opc_attn2 text,
    opc_pd text,
    opc_nd text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.tc_header OWNER TO postgres;

--
-- Name: tc_header_tc_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tc_header_tc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tc_header_tc_id_seq OWNER TO postgres;

--
-- Name: tc_header_tc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tc_header_tc_id_seq OWNED BY public.tc_header.tc_id;


--
-- Name: temp_ch_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_ch_entry (
    temp_ch_id integer NOT NULL,
    temp_entry_id integer,
    max_ch_nm_1310 numeric(10,3),
    max_ch_nm_1550 numeric(10,3),
    max_ch_nm_1625 numeric(10,3)
);


ALTER TABLE public.temp_ch_entry OWNER TO postgres;

--
-- Name: temp_ch_entry_temp_ch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.temp_ch_entry_temp_ch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_ch_entry_temp_ch_id_seq OWNER TO postgres;

--
-- Name: temp_ch_entry_temp_ch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.temp_ch_entry_temp_ch_id_seq OWNED BY public.temp_ch_entry.temp_ch_id;


--
-- Name: temp_cycle_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_cycle_entry (
    temp_cycle_id integer NOT NULL,
    temp_entry_id integer,
    bobbin_no character varying(50),
    temperature integer,
    date date,
    "time" time without time zone,
    nm_1550 numeric(10,3),
    nm_1625 numeric(10,3),
    ch_nm_1550 numeric(10,3),
    ch_nm_1625 numeric(10,3),
    operator character varying(50),
    remark text,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nm_1310 numeric(10,3)
);


ALTER TABLE public.temp_cycle_entry OWNER TO postgres;

--
-- Name: temp_cycle_entry_temp_cycle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.temp_cycle_entry_temp_cycle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_cycle_entry_temp_cycle_id_seq OWNER TO postgres;

--
-- Name: temp_cycle_entry_temp_cycle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.temp_cycle_entry_temp_cycle_id_seq OWNED BY public.temp_cycle_entry.temp_cycle_id;


--
-- Name: temp_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_entry (
    temp_entry_id integer NOT NULL,
    tesing_standrd character varying(100),
    format_no character varying(50),
    gr_clause_no numeric(10,3),
    req_per_gr text,
    bobbin_no character varying(50),
    fiber_length numeric(10,3),
    marker_a character varying(50),
    marker_b character varying(50),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    remark text,
    result character varying(10),
    prepared_by character varying(50),
    checked_by character varying(50),
    physical_obs character varying(100),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT temp_entry_result_check CHECK (((result)::text = ANY (ARRAY[('pass'::character varying)::text, ('fail'::character varying)::text])))
);


ALTER TABLE public.temp_entry OWNER TO postgres;

--
-- Name: temp_entry_temp_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.temp_entry_temp_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_entry_temp_entry_id_seq OWNER TO postgres;

--
-- Name: temp_entry_temp_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.temp_entry_temp_entry_id_seq OWNED BY public.temp_entry.temp_entry_id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    type character varying(30) NOT NULL,
    prod_order character varying(50),
    operation integer,
    conf_qty numeric(10,2),
    fg_batch character varying(10),
    fg_material_code character varying(50),
    comp_material_code character varying(50),
    comp_batch character varying(10),
    comp_quantity numeric(10,2),
    plant character varying(10),
    s_location character varying(10),
    receiving_plant character varying(10),
    receiving_s_location character varying(10),
    issg_or_rcvg_material character varying(50),
    receiving_batch character varying(50),
    uom character varying(10),
    inspection_lot bigint,
    ud_required boolean DEFAULT false NOT NULL,
    status boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    ud_type character varying(3),
    fg_location character varying(10)
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- Name: tray_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tray_master (
    tray_id integer NOT NULL,
    tray_no integer NOT NULL,
    tray_name character varying(50),
    total_positions integer DEFAULT 60,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tray_master OWNER TO postgres;

--
-- Name: tray_master_tray_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tray_master_tray_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tray_master_tray_id_seq OWNER TO postgres;

--
-- Name: tray_master_tray_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tray_master_tray_id_seq OWNED BY public.tray_master.tray_id;


--
-- Name: tray_position; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tray_position (
    tray_position_id integer NOT NULL,
    tray_id integer NOT NULL,
    position_no integer NOT NULL,
    bobbin_no character varying(10),
    status character varying(20) DEFAULT 'EMPTY'::character varying,
    updated_by character varying(50),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tray_position_status_check CHECK (((status)::text = ANY (ARRAY[('EMPTY'::character varying)::text, ('OCCUPIED'::character varying)::text])))
);


ALTER TABLE public.tray_position OWNER TO postgres;

--
-- Name: tray_position_tray_position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tray_position_tray_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tray_position_tray_position_id_seq OWNER TO postgres;

--
-- Name: tray_position_tray_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tray_position_tray_position_id_seq OWNED BY public.tray_position.tray_position_id;


--
-- Name: trh_ch_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trh_ch_entry (
    trh_ch_id integer NOT NULL,
    trh_entry_id integer,
    max_ch_nm_1310 numeric(10,3),
    max_ch_nm_1550 numeric(10,3),
    max_ch_nm_1625 numeric(10,3)
);


ALTER TABLE public.trh_ch_entry OWNER TO postgres;

--
-- Name: trh_ch_entry_trh_ch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trh_ch_entry_trh_ch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trh_ch_entry_trh_ch_id_seq OWNER TO postgres;

--
-- Name: trh_ch_entry_trh_ch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trh_ch_entry_trh_ch_id_seq OWNED BY public.trh_ch_entry.trh_ch_id;


--
-- Name: trh_cycle_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trh_cycle_entry (
    trh_cycle_entry_id integer CONSTRAINT trh_cycle_entry_trh_cyce_entry_id_not_null NOT NULL,
    trh_entry_id integer,
    bobbin_no character varying(50),
    cycle_no integer,
    temperature integer,
    rh character varying(20),
    trh_date date,
    trh_time time without time zone,
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    tested_by character varying(50),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    at_1310 numeric(10,3)
);


ALTER TABLE public.trh_cycle_entry OWNER TO postgres;

--
-- Name: trh_cycle_entry_trh_cyce_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trh_cycle_entry_trh_cyce_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trh_cycle_entry_trh_cyce_entry_id_seq OWNER TO postgres;

--
-- Name: trh_cycle_entry_trh_cyce_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trh_cycle_entry_trh_cyce_entry_id_seq OWNED BY public.trh_cycle_entry.trh_cycle_entry_id;


--
-- Name: trh_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trh_entry (
    trh_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    gr_clause_no numeric(10,3),
    req_per_gr text,
    temp_hum_range character varying(100),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trh_entry OWNER TO postgres;

--
-- Name: trh_entry_trh_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trh_entry_trh_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trh_entry_trh_entry_id_seq OWNER TO postgres;

--
-- Name: trh_entry_trh_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trh_entry_trh_entry_id_seq OWNED BY public.trh_entry.trh_entry_id;


--
-- Name: user_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_departments (
    id integer NOT NULL,
    emp_id character varying(50) NOT NULL,
    department_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_departments OWNER TO postgres;

--
-- Name: user_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_departments_id_seq OWNER TO postgres;

--
-- Name: user_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_departments_id_seq OWNED BY public.user_departments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    emp_id character varying(50) NOT NULL,
    emp_name character varying(100) NOT NULL,
    emp_mail_id character varying(150),
    mobile_no character varying(15),
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password character varying(255),
    is_active boolean DEFAULT true,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('supervisor'::character varying)::text, ('user'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wi_ch_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wi_ch_entry (
    wi_ch_id integer NOT NULL,
    wi_entry_id integer,
    max_ch_nm_1310 numeric(10,3),
    max_ch_nm_1550 numeric(10,3),
    max_ch_nm_1625 numeric(10,3)
);


ALTER TABLE public.wi_ch_entry OWNER TO postgres;

--
-- Name: wi_ch_entry_wi_ch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wi_ch_entry_wi_ch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wi_ch_entry_wi_ch_id_seq OWNER TO postgres;

--
-- Name: wi_ch_entry_wi_ch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wi_ch_entry_wi_ch_id_seq OWNED BY public.wi_ch_entry.wi_ch_id;


--
-- Name: wi_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wi_day_entry (
    wi_day_entry_id integer NOT NULL,
    wi_entry_id integer,
    bobbin_no character varying(50),
    wi_date date,
    wi_day integer,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wi_day_entry OWNER TO postgres;

--
-- Name: wi_day_entry_wi_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wi_day_entry_wi_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wi_day_entry_wi_day_entry_id_seq OWNER TO postgres;

--
-- Name: wi_day_entry_wi_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wi_day_entry_wi_day_entry_id_seq OWNED BY public.wi_day_entry.wi_day_entry_id;


--
-- Name: wi_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wi_entry (
    wi_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    tite character varying(200),
    temp numeric(10,3),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wi_entry OWNER TO postgres;

--
-- Name: wi_entry_wi_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wi_entry_wi_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wi_entry_wi_entry_id_seq OWNER TO postgres;

--
-- Name: wi_entry_wi_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wi_entry_wi_entry_id_seq OWNED BY public.wi_entry.wi_entry_id;


--
-- Name: winding_observation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winding_observation (
    wind_obs_id integer NOT NULL,
    w_o_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false
);


ALTER TABLE public.winding_observation OWNER TO postgres;

--
-- Name: winding_observation_wind_obs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.winding_observation_wind_obs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.winding_observation_wind_obs_id_seq OWNER TO postgres;

--
-- Name: winding_observation_wind_obs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.winding_observation_wind_obs_id_seq OWNED BY public.winding_observation.wind_obs_id;


--
-- Name: aat_ch_entry aat_ch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_ch_entry ALTER COLUMN aat_ch_id SET DEFAULT nextval('public.aat_ch_entry_aat_ch_id_seq'::regclass);


--
-- Name: aat_day_entry aat_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_day_entry ALTER COLUMN aat_day_entry_id SET DEFAULT nextval('public.aat_day_entry_aat_day_entry_id_seq'::regclass);


--
-- Name: aat_entry aat_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_entry ALTER COLUMN aat_entry_id SET DEFAULT nextval('public.aat_entry_aat_entry_id_seq'::regclass);


--
-- Name: app_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config ALTER COLUMN id SET DEFAULT nextval('public.app_config_id_seq'::regclass);


--
-- Name: bobbin_color bobbin_color_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_color ALTER COLUMN bobbin_color_id SET DEFAULT nextval('public.bobbin_color_bobbin_color_id_seq'::regclass);


--
-- Name: bobbin_entries fid_create_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries ALTER COLUMN fid_create_id SET DEFAULT nextval('public.bobbin_entries_fid_create_id_seq'::regclass);


--
-- Name: bobbin_type bobbin_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_type ALTER COLUMN bobbin_type_id SET DEFAULT nextval('public.bobbin_type_bobbin_type_id_seq'::regclass);


--
-- Name: bom_master bom_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master ALTER COLUMN bom_id SET DEFAULT nextval('public.bom_master_bom_id_seq'::regclass);


--
-- Name: col_material_code col_material_code_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.col_material_code ALTER COLUMN col_material_code_id SET DEFAULT nextval('public.col_material_code_col_material_code_id_seq'::regclass);


--
-- Name: color_machine color_machine_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_machine ALTER COLUMN color_machine_id SET DEFAULT nextval('public.color_machine_color_machine_id_seq'::regclass);


--
-- Name: coloring_entry colouring_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coloring_entry ALTER COLUMN colouring_id SET DEFAULT nextval('public.coloring_entry_colouring_id_seq'::regclass);


--
-- Name: customer_table customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_table ALTER COLUMN customer_id SET DEFAULT nextval('public.customer_table_customer_id_seq'::regclass);


--
-- Name: d2_batch_id_seq id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_batch_id_seq ALTER COLUMN id SET DEFAULT nextval('public.d2_batch_id_seq_id_seq'::regclass);


--
-- Name: d2_chamber d2_chamber_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_chamber ALTER COLUMN d2_chamber_id SET DEFAULT nextval('public.d2_chamber_d2_chamber_id_seq'::regclass);


--
-- Name: d2_gas_entry d2_gas_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_gas_entry ALTER COLUMN d2_gas_id SET DEFAULT nextval('public.d2_gas_entry_d2_gas_id_seq'::regclass);


--
-- Name: d2_issue d2_isseue_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue ALTER COLUMN d2_isseue_id SET DEFAULT nextval('public.d2_issue_d2_isseue_id_seq'::regclass);


--
-- Name: d2_issue_draft d2_draft_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue_draft ALTER COLUMN d2_draft_id SET DEFAULT nextval('public.d2_issue_draft_d2_draft_id_seq'::regclass);


--
-- Name: d_fiber_cut_reasons dfcr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons ALTER COLUMN dfcr_id SET DEFAULT nextval('public.d_fiber_cut_reasons_dfcr_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: draw_break_analysis break_analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_break_analysis ALTER COLUMN break_analysis_id SET DEFAULT nextval('public.draw_break_analysis_break_analysis_id_seq'::regclass);


--
-- Name: draw_flaw_details draw_flaw_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details ALTER COLUMN draw_flaw_id SET DEFAULT nextval('public.draw_flaw_details_draw_flaw_id_seq'::regclass);


--
-- Name: draw_shift_plan dsp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_shift_plan ALTER COLUMN dsp_id SET DEFAULT nextval('public.draw_shift_plan_dsp_id_seq'::regclass);


--
-- Name: draw_tower tower_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower ALTER COLUMN tower_id SET DEFAULT nextval('public.draw_tower_tower_id_seq'::regclass);


--
-- Name: draw_users draw_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_users ALTER COLUMN draw_user_id SET DEFAULT nextval('public.draw_users_draw_user_id_seq'::regclass);


--
-- Name: dyanmic_fartique dynamic_fartique_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique ALTER COLUMN dynamic_fartique_id SET DEFAULT nextval('public.dyanmic_fartique_dynamic_fartique_id_seq'::regclass);


--
-- Name: dyanmic_fartique_speed dyanmic_fartique_speed_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique_speed ALTER COLUMN dyanmic_fartique_speed_id SET DEFAULT nextval('public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq'::regclass);


--
-- Name: f_cable_cable_cutoff id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cable_cable_cutoff ALTER COLUMN id SET DEFAULT nextval('public.f_cable_cable_cutoff_id_seq'::regclass);


--
-- Name: f_cd_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cd_history ALTER COLUMN id SET DEFAULT nextval('public.f_cd_history_id_seq'::regclass);


--
-- Name: f_coating_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_coating_history ALTER COLUMN id SET DEFAULT nextval('public.f_coating_history_id_seq'::regclass);


--
-- Name: f_curl_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_curl_history ALTER COLUMN id SET DEFAULT nextval('public.f_curl_history_id_seq'::regclass);


--
-- Name: f_cutoff_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cutoff_history ALTER COLUMN id SET DEFAULT nextval('public.f_cutoff_history_id_seq'::regclass);


--
-- Name: f_geometry_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_geometry_history ALTER COLUMN id SET DEFAULT nextval('public.f_geometry_history_id_seq'::regclass);


--
-- Name: f_length_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_length_history ALTER COLUMN id SET DEFAULT nextval('public.f_length_history_id_seq'::regclass);


--
-- Name: f_mbend_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mbend_history ALTER COLUMN id SET DEFAULT nextval('public.f_mbend_history_id_seq'::regclass);


--
-- Name: f_mfd_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mfd_history ALTER COLUMN id SET DEFAULT nextval('public.f_mfd_history_id_seq'::regclass);


--
-- Name: f_pmd_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_pmd_history ALTER COLUMN id SET DEFAULT nextval('public.f_pmd_history_id_seq'::regclass);


--
-- Name: f_spectral_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_spectral_history ALTER COLUMN id SET DEFAULT nextval('public.f_spectral_history_id_seq'::regclass);


--
-- Name: fg_color fg_color_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_color ALTER COLUMN fg_color_id SET DEFAULT nextval('public.fg_color_fg_color_id_seq'::regclass);


--
-- Name: fg_rewind fg_rewind_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_rewind ALTER COLUMN fg_rewind_id SET DEFAULT nextval('public.fg_rewind_fg_rewind_id_seq'::regclass);


--
-- Name: fiber_color fiber_color_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_color ALTER COLUMN fiber_color_id SET DEFAULT nextval('public.fiber_color_fiber_color_id_seq'::regclass);


--
-- Name: fiber_cut_indication indication_fiber_cut_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_cut_indication ALTER COLUMN indication_fiber_cut_id SET DEFAULT nextval('public.fiber_cut_indication_indication_fiber_cut_id_seq'::regclass);


--
-- Name: function_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.function_reports ALTER COLUMN id SET DEFAULT nextval('public.function_reports_id_seq'::regclass);


--
-- Name: grade_mandatory grade_mandatory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_mandatory ALTER COLUMN grade_mandatory_id SET DEFAULT nextval('public.grade_mandatory_grade_mandatory_id_seq'::regclass);


--
-- Name: h2_ageing h2_ageing_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_ageing ALTER COLUMN h2_ageing_id SET DEFAULT nextval('public.h2_ageing_h2_ageing_id_seq'::regclass);


--
-- Name: h2_chamber h2_chamber_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_chamber ALTER COLUMN h2_chamber_id SET DEFAULT nextval('public.h2_chamber_h2_chamber_id_seq'::regclass);


--
-- Name: handle_join handle_join_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join ALTER COLUMN handle_join_id SET DEFAULT nextval('public.handle_join_handle_join_id_seq'::regclass);


--
-- Name: hot_water_ch_entry hot_water_ch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_ch_entry ALTER COLUMN hot_water_ch_id SET DEFAULT nextval('public.hot_water_ch_entry_hot_water_ch_id_seq'::regclass);


--
-- Name: hot_water_day_entry hot_water_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_day_entry ALTER COLUMN hot_water_day_entry_id SET DEFAULT nextval('public.hot_water_day_entry_hot_water_day_entry_id_seq'::regclass);


--
-- Name: hot_water_entry hot_water_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_entry ALTER COLUMN hot_water_entry_id SET DEFAULT nextval('public.hot_water_entry_hot_water_entry_id_seq'::regclass);


--
-- Name: htha_ch_entry htha_ch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_ch_entry ALTER COLUMN htha_ch_id SET DEFAULT nextval('public.htha_ch_entry_htha_ch_id_seq'::regclass);


--
-- Name: htha_day_entry htha_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_day_entry ALTER COLUMN htha_day_entry_id SET DEFAULT nextval('public.htha_day_entry_htha_day_entry_id_seq'::regclass);


--
-- Name: htha_entry htha_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_entry ALTER COLUMN htha_entry_id SET DEFAULT nextval('public.htha_entry_htha_entry_id_seq'::regclass);


--
-- Name: mail_drafts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mail_drafts ALTER COLUMN id SET DEFAULT nextval('public.mail_drafts_id_seq'::regclass);


--
-- Name: master_preform_type preform_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type ALTER COLUMN preform_type_id SET DEFAULT nextval('public.master_preform_type_preform_type_id_seq'::regclass);


--
-- Name: mat_stock mat_stock_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mat_stock ALTER COLUMN mat_stock_id SET DEFAULT nextval('public.mat_stock_mat_stock_id_seq'::regclass);


--
-- Name: order_comp order_comp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_comp ALTER COLUMN order_comp_id SET DEFAULT nextval('public.order_comp_order_comp_id_seq'::regclass);


--
-- Name: order_conf order_conf_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_conf ALTER COLUMN order_conf_id SET DEFAULT nextval('public.order_conf_order_conf_id_seq'::regclass);


--
-- Name: order_opr order_opr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_opr ALTER COLUMN order_opr_id SET DEFAULT nextval('public.order_opr_order_opr_id_seq'::regclass);


--
-- Name: packing_order packing_order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order ALTER COLUMN packing_order_id SET DEFAULT nextval('public.packing_order_packing_order_id_seq'::regclass);


--
-- Name: packing_order_bobbin packing_order_bobbin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin ALTER COLUMN packing_order_bobbin_id SET DEFAULT nextval('public.packing_order_bobbin_packing_order_bobbin_id_seq'::regclass);


--
-- Name: preform_accept acceptance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept ALTER COLUMN acceptance_id SET DEFAULT nextval('public.preform_accept_acceptance_id_seq'::regclass);


--
-- Name: preform_allocation allocation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation ALTER COLUMN allocation_id SET DEFAULT nextval('public.preform_allocation_allocation_id_seq'::regclass);


--
-- Name: preform_process_type_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.preform_process_type_mapping_mapping_id_seq'::regclass);


--
-- Name: preform_vendor preform_vendor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_vendor ALTER COLUMN preform_vendor_id SET DEFAULT nextval('public.preform_vendor_preform_vendor_id_seq'::regclass);


--
-- Name: process_order process_o_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_order ALTER COLUMN process_o_id SET DEFAULT nextval('public.process_order_process_o_id_seq'::regclass);


--
-- Name: process_type_master process_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_type_master ALTER COLUMN process_type_id SET DEFAULT nextval('public.process_type_master_process_type_id_seq'::regclass);


--
-- Name: pt_allocation pt_allocation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation ALTER COLUMN pt_allocation_id SET DEFAULT nextval('public.pt_allocation_pt_allocation_id_seq'::regclass);


--
-- Name: pt_break_analysis break_analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_break_analysis ALTER COLUMN break_analysis_id SET DEFAULT nextval('public.pt_break_analysis_break_analysis_id_seq'::regclass);


--
-- Name: pt_entry pt_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry ALTER COLUMN pt_entry_id SET DEFAULT nextval('public.pt_entry_pt_entry_id_seq'::regclass);


--
-- Name: pt_flaw_details pt_flaw_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_flaw_details ALTER COLUMN pt_flaw_id SET DEFAULT nextval('public.pt_flaw_details_pt_flaw_id_seq'::regclass);


--
-- Name: pt_machine pt_machine_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine ALTER COLUMN pt_machine_id SET DEFAULT nextval('public.pt_machine_pt_machine_id_seq'::regclass);


--
-- Name: pt_users pt_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_users ALTER COLUMN pt_user_id SET DEFAULT nextval('public.pt_users_pt_user_id_seq'::regclass);


--
-- Name: pv_entries pv_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pv_entries ALTER COLUMN pv_entry_id SET DEFAULT nextval('public.pv_entries_pv_entry_id_seq'::regclass);


--
-- Name: qc_grade qc_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_grade ALTER COLUMN qc_entry_id SET DEFAULT nextval('public.qc_grade_qc_entry_id_seq'::regclass);


--
-- Name: qc_out qc_out_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_out ALTER COLUMN qc_out_id SET DEFAULT nextval('public.qc_out_qc_out_id_seq'::regclass);


--
-- Name: qc_users qc_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_users ALTER COLUMN qc_user_id SET DEFAULT nextval('public.qc_users_qc_user_id_seq'::regclass);


--
-- Name: report_execution_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_execution_log ALTER COLUMN id SET DEFAULT nextval('public.report_execution_log_id_seq'::regclass);


--
-- Name: report_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_master ALTER COLUMN id SET DEFAULT nextval('public.report_master_id_seq'::regclass);


--
-- Name: report_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_permissions ALTER COLUMN id SET DEFAULT nextval('public.report_permissions_id_seq'::regclass);


--
-- Name: report_saved_filters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_saved_filters ALTER COLUMN id SET DEFAULT nextval('public.report_saved_filters_id_seq'::regclass);


--
-- Name: report_section_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.report_section_mapping_mapping_id_seq'::regclass);


--
-- Name: report_section_master section_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_master ALTER COLUMN section_id SET DEFAULT nextval('public.report_section_master_section_id_seq'::regclass);


--
-- Name: report_sheets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sheets ALTER COLUMN id SET DEFAULT nextval('public.report_sheets_id_seq'::regclass);


--
-- Name: report_tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables ALTER COLUMN id SET DEFAULT nextval('public.report_tables_id_seq'::regclass);


--
-- Name: report_version_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_version_history ALTER COLUMN id SET DEFAULT nextval('public.report_version_history_id_seq'::regclass);


--
-- Name: rew_machine rew_machine_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rew_machine ALTER COLUMN rew_machine_id SET DEFAULT nextval('public.rew_machine_rew_machine_id_seq'::regclass);


--
-- Name: rewind_instr rewind_instr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewind_instr ALTER COLUMN rewind_instr_id SET DEFAULT nextval('public.rewind_instr_rewind_instr_id_seq'::regclass);


--
-- Name: rewinding_entry rewinding_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewinding_entry ALTER COLUMN rewinding_id SET DEFAULT nextval('public.rewinding_entry_rewinding_id_seq'::regclass);


--
-- Name: sap_transaction_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sap_transaction_log ALTER COLUMN log_id SET DEFAULT nextval('public.sap_transaction_log_log_id_seq'::regclass);


--
-- Name: scheduled_mails id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_mails ALTER COLUMN id SET DEFAULT nextval('public.scheduled_mails_id_seq'::regclass);


--
-- Name: shifts shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN shift_id SET DEFAULT nextval('public.shifts_shift_id_seq'::regclass);


--
-- Name: spec_mandatory spec_mandatory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_mandatory ALTER COLUMN spec_mandatory_id SET DEFAULT nextval('public.spec_mandatory_spec_mandatory_id_seq'::regclass);


--
-- Name: spec_master spec_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_master ALTER COLUMN spec_id SET DEFAULT nextval('public.spec_master_spec_id_seq'::regclass);


--
-- Name: splicing_entry splicing_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splicing_entry ALTER COLUMN splicing_id SET DEFAULT nextval('public.splicing_entry_splicing_id_seq'::regclass);


--
-- Name: tc_detail tc_detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_detail ALTER COLUMN tc_detail_id SET DEFAULT nextval('public.tc_detail_tc_detail_id_seq'::regclass);


--
-- Name: tc_header tc_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_header ALTER COLUMN tc_id SET DEFAULT nextval('public.tc_header_tc_id_seq'::regclass);


--
-- Name: temp_ch_entry temp_ch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_ch_entry ALTER COLUMN temp_ch_id SET DEFAULT nextval('public.temp_ch_entry_temp_ch_id_seq'::regclass);


--
-- Name: temp_cycle_entry temp_cycle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_cycle_entry ALTER COLUMN temp_cycle_id SET DEFAULT nextval('public.temp_cycle_entry_temp_cycle_id_seq'::regclass);


--
-- Name: temp_entry temp_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_entry ALTER COLUMN temp_entry_id SET DEFAULT nextval('public.temp_entry_temp_entry_id_seq'::regclass);


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- Name: tray_master tray_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_master ALTER COLUMN tray_id SET DEFAULT nextval('public.tray_master_tray_id_seq'::regclass);


--
-- Name: tray_position tray_position_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position ALTER COLUMN tray_position_id SET DEFAULT nextval('public.tray_position_tray_position_id_seq'::regclass);


--
-- Name: trh_ch_entry trh_ch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_ch_entry ALTER COLUMN trh_ch_id SET DEFAULT nextval('public.trh_ch_entry_trh_ch_id_seq'::regclass);


--
-- Name: trh_cycle_entry trh_cycle_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_cycle_entry ALTER COLUMN trh_cycle_entry_id SET DEFAULT nextval('public.trh_cycle_entry_trh_cyce_entry_id_seq'::regclass);


--
-- Name: trh_entry trh_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_entry ALTER COLUMN trh_entry_id SET DEFAULT nextval('public.trh_entry_trh_entry_id_seq'::regclass);


--
-- Name: user_departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments ALTER COLUMN id SET DEFAULT nextval('public.user_departments_id_seq'::regclass);


--
-- Name: wi_ch_entry wi_ch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_ch_entry ALTER COLUMN wi_ch_id SET DEFAULT nextval('public.wi_ch_entry_wi_ch_id_seq'::regclass);


--
-- Name: wi_day_entry wi_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_day_entry ALTER COLUMN wi_day_entry_id SET DEFAULT nextval('public.wi_day_entry_wi_day_entry_id_seq'::regclass);


--
-- Name: wi_entry wi_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_entry ALTER COLUMN wi_entry_id SET DEFAULT nextval('public.wi_entry_wi_entry_id_seq'::regclass);


--
-- Name: winding_observation wind_obs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winding_observation ALTER COLUMN wind_obs_id SET DEFAULT nextval('public.winding_observation_wind_obs_id_seq'::regclass);


--
-- Name: aat_ch_entry aat_ch_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_ch_entry
    ADD CONSTRAINT aat_ch_entry_pkey PRIMARY KEY (aat_ch_id);


--
-- Name: aat_day_entry aat_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_day_entry
    ADD CONSTRAINT aat_day_entry_pkey PRIMARY KEY (aat_day_entry_id);


--
-- Name: aat_entry aat_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_entry
    ADD CONSTRAINT aat_entry_pkey PRIMARY KEY (aat_entry_id);


--
-- Name: app_config app_config_config_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_config_key_key UNIQUE (config_key);


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (id);


--
-- Name: bobbin_color bobbin_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_color
    ADD CONSTRAINT bobbin_color_pkey PRIMARY KEY (bobbin_color_id);


--
-- Name: bobbin_entries bobbin_entries_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries
    ADD CONSTRAINT bobbin_entries_fid_key UNIQUE (fid);


--
-- Name: bobbin_entries bobbin_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries
    ADD CONSTRAINT bobbin_entries_pkey PRIMARY KEY (fid_create_id);


--
-- Name: bobbin_type bobbin_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_type
    ADD CONSTRAINT bobbin_type_pkey PRIMARY KEY (bobbin_type_id);


--
-- Name: bom_master bom_master_material_code_component_material_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master
    ADD CONSTRAINT bom_master_material_code_component_material_code_key UNIQUE (material_code, component_material_code);


--
-- Name: bom_master bom_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master
    ADD CONSTRAINT bom_master_pkey PRIMARY KEY (bom_id);


--
-- Name: col_material_code col_material_code_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.col_material_code
    ADD CONSTRAINT col_material_code_pkey PRIMARY KEY (col_material_code_id);


--
-- Name: color_machine color_machine_color_machine_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_machine
    ADD CONSTRAINT color_machine_color_machine_no_key UNIQUE (color_machine_no);


--
-- Name: color_machine color_machine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_machine
    ADD CONSTRAINT color_machine_pkey PRIMARY KEY (color_machine_id);


--
-- Name: coloring_entry coloring_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coloring_entry
    ADD CONSTRAINT coloring_entry_pkey PRIMARY KEY (colouring_id);


--
-- Name: customer_complaint customer_complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_complaint
    ADD CONSTRAINT customer_complaint_pkey PRIMARY KEY (complaint_id);


--
-- Name: customer_table customer_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_table
    ADD CONSTRAINT customer_table_pkey PRIMARY KEY (customer_id);


--
-- Name: d2_batch_id_seq d2_batch_id_seq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_batch_id_seq
    ADD CONSTRAINT d2_batch_id_seq_pkey PRIMARY KEY (id);


--
-- Name: d2_chamber d2_chamber_d2_chamber_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_chamber
    ADD CONSTRAINT d2_chamber_d2_chamber_no_key UNIQUE (d2_chamber_no);


--
-- Name: d2_chamber d2_chamber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_chamber
    ADD CONSTRAINT d2_chamber_pkey PRIMARY KEY (d2_chamber_id);


--
-- Name: d2_gas_entry d2_gas_entry_d2_batch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_gas_entry
    ADD CONSTRAINT d2_gas_entry_d2_batch_id_key UNIQUE (d2_batch_id);


--
-- Name: d2_gas_entry d2_gas_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_gas_entry
    ADD CONSTRAINT d2_gas_entry_pkey PRIMARY KEY (d2_gas_id);


--
-- Name: d2_issue d2_issue_bobbin_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue
    ADD CONSTRAINT d2_issue_bobbin_fid_key UNIQUE (bobbin_fid);


--
-- Name: d2_issue d2_issue_bobbin_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue
    ADD CONSTRAINT d2_issue_bobbin_no_key UNIQUE (bobbin_no);


--
-- Name: d2_issue_draft d2_issue_draft_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue_draft
    ADD CONSTRAINT d2_issue_draft_pkey PRIMARY KEY (d2_draft_id);


--
-- Name: d2_issue d2_issue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue
    ADD CONSTRAINT d2_issue_pkey PRIMARY KEY (d2_isseue_id);


--
-- Name: d_fiber_cut_reasons d_fiber_cut_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons
    ADD CONSTRAINT d_fiber_cut_reasons_pkey PRIMARY KEY (dfcr_id);


--
-- Name: departments departments_d_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_d_name_key UNIQUE (d_name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: draw_break_analysis draw_break_analysis_fiber_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_break_analysis
    ADD CONSTRAINT draw_break_analysis_fiber_id_key UNIQUE (fiber_id);


--
-- Name: draw_break_analysis draw_break_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_break_analysis
    ADD CONSTRAINT draw_break_analysis_pkey PRIMARY KEY (break_analysis_id);


--
-- Name: draw_entry draw_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT draw_entry_pkey PRIMARY KEY (spool_id);


--
-- Name: draw_flaw_details draw_flaw_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details
    ADD CONSTRAINT draw_flaw_details_pkey PRIMARY KEY (draw_flaw_id);


--
-- Name: draw_shift_plan draw_shift_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_shift_plan
    ADD CONSTRAINT draw_shift_plan_pkey PRIMARY KEY (dsp_id);


--
-- Name: draw_tower draw_tower_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower
    ADD CONSTRAINT draw_tower_pkey PRIMARY KEY (tower_id);


--
-- Name: draw_tower draw_tower_tower_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower
    ADD CONSTRAINT draw_tower_tower_no_key UNIQUE (tower_no);


--
-- Name: draw_users draw_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_users
    ADD CONSTRAINT draw_users_pkey PRIMARY KEY (draw_user_id);


--
-- Name: dyanmic_fartique dyanmic_fartique_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique
    ADD CONSTRAINT dyanmic_fartique_pkey PRIMARY KEY (dynamic_fartique_id);


--
-- Name: dyanmic_fartique_speed dyanmic_fartique_speed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique_speed
    ADD CONSTRAINT dyanmic_fartique_speed_pkey PRIMARY KEY (dyanmic_fartique_speed_id);


--
-- Name: f_cable_cable_cutoff f_cable_cable_cutoff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cable_cable_cutoff
    ADD CONSTRAINT f_cable_cable_cutoff_pkey PRIMARY KEY (id);


--
-- Name: f_cd_history f_cd_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cd_history
    ADD CONSTRAINT f_cd_history_pkey PRIMARY KEY (id);


--
-- Name: f_coating_history f_coating_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_coating_history
    ADD CONSTRAINT f_coating_history_pkey PRIMARY KEY (id);


--
-- Name: f_curl_history f_curl_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_curl_history
    ADD CONSTRAINT f_curl_history_pkey PRIMARY KEY (id);


--
-- Name: f_cutoff_history f_cutoff_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cutoff_history
    ADD CONSTRAINT f_cutoff_history_pkey PRIMARY KEY (id);


--
-- Name: f_geometry_history f_geometry_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_geometry_history
    ADD CONSTRAINT f_geometry_history_pkey PRIMARY KEY (id);


--
-- Name: f_length_history f_length_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_length_history
    ADD CONSTRAINT f_length_history_pkey PRIMARY KEY (id);


--
-- Name: f_mbend_history f_mbend_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mbend_history
    ADD CONSTRAINT f_mbend_history_pkey PRIMARY KEY (id);


--
-- Name: f_mfd_history f_mfd_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mfd_history
    ADD CONSTRAINT f_mfd_history_pkey PRIMARY KEY (id);


--
-- Name: f_pmd_history f_pmd_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_pmd_history
    ADD CONSTRAINT f_pmd_history_pkey PRIMARY KEY (id);


--
-- Name: f_spectral_history f_spectral_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_spectral_history
    ADD CONSTRAINT f_spectral_history_pkey PRIMARY KEY (id);


--
-- Name: fg_color fg_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_color
    ADD CONSTRAINT fg_color_pkey PRIMARY KEY (fg_color_id);


--
-- Name: fg_rewind fg_rewind_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_rewind
    ADD CONSTRAINT fg_rewind_pkey PRIMARY KEY (fg_rewind_id);


--
-- Name: fiber_color fiber_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_color
    ADD CONSTRAINT fiber_color_pkey PRIMARY KEY (fiber_color_id);


--
-- Name: fiber_cut_indication fiber_cut_indication_indication_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_cut_indication
    ADD CONSTRAINT fiber_cut_indication_indication_name_key UNIQUE (indication_name);


--
-- Name: fiber_cut_indication fiber_cut_indication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_cut_indication
    ADD CONSTRAINT fiber_cut_indication_pkey PRIMARY KEY (indication_fiber_cut_id);


--
-- Name: function_reports function_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.function_reports
    ADD CONSTRAINT function_reports_pkey PRIMARY KEY (id);


--
-- Name: grade_mandatory grade_mandatory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_mandatory
    ADD CONSTRAINT grade_mandatory_pkey PRIMARY KEY (grade_mandatory_id);


--
-- Name: h2_ageing h2_ageing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_ageing
    ADD CONSTRAINT h2_ageing_pkey PRIMARY KEY (h2_ageing_id);


--
-- Name: h2_chamber h2_chamber_h2_chamber_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_chamber
    ADD CONSTRAINT h2_chamber_h2_chamber_no_key UNIQUE (h2_chamber_no);


--
-- Name: h2_chamber h2_chamber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_chamber
    ADD CONSTRAINT h2_chamber_pkey PRIMARY KEY (h2_chamber_id);


--
-- Name: handle_join handle_join_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join
    ADD CONSTRAINT handle_join_pkey PRIMARY KEY (handle_join_id);


--
-- Name: hot_water_ch_entry hot_water_ch_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_ch_entry
    ADD CONSTRAINT hot_water_ch_entry_pkey PRIMARY KEY (hot_water_ch_id);


--
-- Name: hot_water_day_entry hot_water_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_day_entry
    ADD CONSTRAINT hot_water_day_entry_pkey PRIMARY KEY (hot_water_day_entry_id);


--
-- Name: hot_water_entry hot_water_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_entry
    ADD CONSTRAINT hot_water_entry_pkey PRIMARY KEY (hot_water_entry_id);


--
-- Name: htha_ch_entry htha_ch_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_ch_entry
    ADD CONSTRAINT htha_ch_entry_pkey PRIMARY KEY (htha_ch_id);


--
-- Name: htha_day_entry htha_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_day_entry
    ADD CONSTRAINT htha_day_entry_pkey PRIMARY KEY (htha_day_entry_id);


--
-- Name: htha_entry htha_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_entry
    ADD CONSTRAINT htha_entry_pkey PRIMARY KEY (htha_entry_id);


--
-- Name: mail_drafts mail_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mail_drafts
    ADD CONSTRAINT mail_drafts_pkey PRIMARY KEY (id);


--
-- Name: master_preform_type master_preform_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_pkey PRIMARY KEY (preform_type_id);


--
-- Name: master_preform_type master_preform_type_preform_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_preform_type_name_key UNIQUE (preform_type_name);


--
-- Name: mat_stock mat_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mat_stock
    ADD CONSTRAINT mat_stock_pkey PRIMARY KEY (mat_stock_id);


--
-- Name: material_master material_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_master
    ADD CONSTRAINT material_master_pkey PRIMARY KEY (material_code);


--
-- Name: order_comp order_comp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_comp
    ADD CONSTRAINT order_comp_pkey PRIMARY KEY (order_comp_id);


--
-- Name: order_conf order_conf_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_conf
    ADD CONSTRAINT order_conf_pkey PRIMARY KEY (order_conf_id);


--
-- Name: order_hdr order_hdr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_hdr
    ADD CONSTRAINT order_hdr_pkey PRIMARY KEY (order_no);


--
-- Name: order_opr order_opr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_opr
    ADD CONSTRAINT order_opr_pkey PRIMARY KEY (order_opr_id);


--
-- Name: packing_order_bobbin packing_order_bobbin_packing_order_bobbin_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin
    ADD CONSTRAINT packing_order_bobbin_packing_order_bobbin_no_key UNIQUE (packing_order, bobbin_no);


--
-- Name: packing_order_bobbin packing_order_bobbin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin
    ADD CONSTRAINT packing_order_bobbin_pkey PRIMARY KEY (packing_order_bobbin_id);


--
-- Name: packing_order packing_order_order_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order
    ADD CONSTRAINT packing_order_order_no_key UNIQUE (order_no);


--
-- Name: packing_order packing_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order
    ADD CONSTRAINT packing_order_pkey PRIMARY KEY (packing_order_id);


--
-- Name: preform_accept preform_accept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT preform_accept_pkey PRIMARY KEY (acceptance_id);


--
-- Name: preform_allocation preform_allocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_pkey PRIMARY KEY (allocation_id);


--
-- Name: preform_data preform_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_data
    ADD CONSTRAINT preform_data_pkey PRIMARY KEY (preform_id);


--
-- Name: preform_process_type_mapping preform_process_type_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping
    ADD CONSTRAINT preform_process_type_mapping_pkey PRIMARY KEY (mapping_id);


--
-- Name: preform_process_type_mapping preform_process_type_mapping_preform_type_process_type_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping
    ADD CONSTRAINT preform_process_type_mapping_preform_type_process_type_id_key UNIQUE (preform_type, process_type_id);


--
-- Name: preform_vendor preform_vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_vendor
    ADD CONSTRAINT preform_vendor_pkey PRIMARY KEY (preform_vendor_id);


--
-- Name: preform_vendor preform_vendor_vendor_initial_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_vendor
    ADD CONSTRAINT preform_vendor_vendor_initial_key UNIQUE (vendor_initial);


--
-- Name: preform_vendor preform_vendor_vendor_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_vendor
    ADD CONSTRAINT preform_vendor_vendor_name_key UNIQUE (vendor_name);


--
-- Name: process_order process_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_order
    ADD CONSTRAINT process_order_pkey PRIMARY KEY (process_o_id);


--
-- Name: process_type_master process_type_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_type_master
    ADD CONSTRAINT process_type_master_pkey PRIMARY KEY (process_type_id);


--
-- Name: process_type_master process_type_master_process_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_type_master
    ADD CONSTRAINT process_type_master_process_type_key UNIQUE (process_type);


--
-- Name: pt_allocation pt_allocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation
    ADD CONSTRAINT pt_allocation_pkey PRIMARY KEY (pt_allocation_id);


--
-- Name: pt_break_analysis pt_break_analysis_fiber_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_break_analysis
    ADD CONSTRAINT pt_break_analysis_fiber_id_key UNIQUE (fiber_id);


--
-- Name: pt_break_analysis pt_break_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_break_analysis
    ADD CONSTRAINT pt_break_analysis_pkey PRIMARY KEY (break_analysis_id);


--
-- Name: pt_entry pt_entry_bobbin_no_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry
    ADD CONSTRAINT pt_entry_bobbin_no_unique UNIQUE (bobbin_no);


--
-- Name: pt_entry pt_entry_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry
    ADD CONSTRAINT pt_entry_fid_key UNIQUE (fid);


--
-- Name: pt_entry pt_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry
    ADD CONSTRAINT pt_entry_pkey PRIMARY KEY (pt_entry_id);


--
-- Name: pt_flaw_details pt_flaw_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_flaw_details
    ADD CONSTRAINT pt_flaw_details_pkey PRIMARY KEY (pt_flaw_id);


--
-- Name: pt_machine_logs pt_machine_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine_logs
    ADD CONSTRAINT pt_machine_logs_pkey PRIMARY KEY (spool_code_tu, machine_number);


--
-- Name: pt_machine pt_machine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine
    ADD CONSTRAINT pt_machine_pkey PRIMARY KEY (pt_machine_id);


--
-- Name: pt_machine pt_machine_pt_machine_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine
    ADD CONSTRAINT pt_machine_pt_machine_no_key UNIQUE (pt_machine_no);


--
-- Name: pt_users pt_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_users
    ADD CONSTRAINT pt_users_pkey PRIMARY KEY (pt_user_id);


--
-- Name: pv_entries pv_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pv_entries
    ADD CONSTRAINT pv_entries_pkey PRIMARY KEY (pv_entry_id);


--
-- Name: qc_entry qc_entry_bobbin_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry
    ADD CONSTRAINT qc_entry_bobbin_fid_key UNIQUE (bobbin_fid);


--
-- Name: qc_entry qc_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry
    ADD CONSTRAINT qc_entry_pkey PRIMARY KEY (bobbin_no);


--
-- Name: qc_entry_temp qc_entry_temp_bobbin_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry_temp
    ADD CONSTRAINT qc_entry_temp_bobbin_fid_key UNIQUE (bobbin_fid);


--
-- Name: qc_entry_temp qc_entry_temp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry_temp
    ADD CONSTRAINT qc_entry_temp_pkey PRIMARY KEY (bobbin_no);


--
-- Name: qc_grade qc_grade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_grade
    ADD CONSTRAINT qc_grade_pkey PRIMARY KEY (qc_entry_id);


--
-- Name: qc_out qc_out_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_out
    ADD CONSTRAINT qc_out_pkey PRIMARY KEY (qc_out_id);


--
-- Name: qc_users qc_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_users
    ADD CONSTRAINT qc_users_pkey PRIMARY KEY (qc_user_id);


--
-- Name: report_execution_log report_execution_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_execution_log
    ADD CONSTRAINT report_execution_log_pkey PRIMARY KEY (id);


--
-- Name: report_master report_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_master
    ADD CONSTRAINT report_master_pkey PRIMARY KEY (id);


--
-- Name: report_permissions report_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_permissions
    ADD CONSTRAINT report_permissions_pkey PRIMARY KEY (id);


--
-- Name: report_saved_filters report_saved_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_saved_filters
    ADD CONSTRAINT report_saved_filters_pkey PRIMARY KEY (id);


--
-- Name: report_section_mapping report_section_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_pkey PRIMARY KEY (mapping_id);


--
-- Name: report_section_mapping report_section_mapping_report_id_section_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_report_id_section_id_key UNIQUE (report_id, section_id);


--
-- Name: report_section_master report_section_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_master
    ADD CONSTRAINT report_section_master_pkey PRIMARY KEY (section_id);


--
-- Name: report_section_master report_section_master_section_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_master
    ADD CONSTRAINT report_section_master_section_key_key UNIQUE (section_key);


--
-- Name: report_sheets report_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sheets
    ADD CONSTRAINT report_sheets_pkey PRIMARY KEY (id);


--
-- Name: report_tables report_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables
    ADD CONSTRAINT report_tables_pkey PRIMARY KEY (id);


--
-- Name: report_version_history report_version_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_version_history
    ADD CONSTRAINT report_version_history_pkey PRIMARY KEY (id);


--
-- Name: rew_machine rew_machine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rew_machine
    ADD CONSTRAINT rew_machine_pkey PRIMARY KEY (rew_machine_id);


--
-- Name: rew_machine rew_machine_rew_machine_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rew_machine
    ADD CONSTRAINT rew_machine_rew_machine_no_key UNIQUE (rew_machine_no);


--
-- Name: rewind_instr rewind_instr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewind_instr
    ADD CONSTRAINT rewind_instr_pkey PRIMARY KEY (rewind_instr_id);


--
-- Name: rewinding_entry rewinding_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewinding_entry
    ADD CONSTRAINT rewinding_entry_pkey PRIMARY KEY (rewinding_id);


--
-- Name: sap_transaction_log sap_transaction_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sap_transaction_log
    ADD CONSTRAINT sap_transaction_log_pkey PRIMARY KEY (log_id);


--
-- Name: scheduled_mails scheduled_mails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_mails
    ADD CONSTRAINT scheduled_mails_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (shift_id);


--
-- Name: spec_mandatory spec_mandatory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_mandatory
    ADD CONSTRAINT spec_mandatory_pkey PRIMARY KEY (spec_mandatory_id);


--
-- Name: spec_master spec_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_master
    ADD CONSTRAINT spec_master_pkey PRIMARY KEY (spec_id);


--
-- Name: splicing_entry splicing_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splicing_entry
    ADD CONSTRAINT splicing_entry_pkey PRIMARY KEY (splicing_id);


--
-- Name: tc_detail tc_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_detail
    ADD CONSTRAINT tc_detail_pkey PRIMARY KEY (tc_detail_id);


--
-- Name: tc_header tc_header_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_header
    ADD CONSTRAINT tc_header_pkey PRIMARY KEY (tc_id);


--
-- Name: tc_header tc_header_tc_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_header
    ADD CONSTRAINT tc_header_tc_number_key UNIQUE (tc_number);


--
-- Name: temp_ch_entry temp_ch_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_ch_entry
    ADD CONSTRAINT temp_ch_entry_pkey PRIMARY KEY (temp_ch_id);


--
-- Name: temp_cycle_entry temp_cycle_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_cycle_entry
    ADD CONSTRAINT temp_cycle_entry_pkey PRIMARY KEY (temp_cycle_id);


--
-- Name: temp_entry temp_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_entry
    ADD CONSTRAINT temp_entry_pkey PRIMARY KEY (temp_entry_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: tray_master tray_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_master
    ADD CONSTRAINT tray_master_pkey PRIMARY KEY (tray_id);


--
-- Name: tray_master tray_master_tray_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_master
    ADD CONSTRAINT tray_master_tray_no_key UNIQUE (tray_no);


--
-- Name: tray_position tray_position_bobbin_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_bobbin_no_key UNIQUE (bobbin_no);


--
-- Name: tray_position tray_position_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_pkey PRIMARY KEY (tray_position_id);


--
-- Name: tray_position tray_position_tray_id_position_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_tray_id_position_no_key UNIQUE (tray_id, position_no);


--
-- Name: trh_ch_entry trh_ch_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_ch_entry
    ADD CONSTRAINT trh_ch_entry_pkey PRIMARY KEY (trh_ch_id);


--
-- Name: trh_cycle_entry trh_cycle_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_cycle_entry
    ADD CONSTRAINT trh_cycle_entry_pkey PRIMARY KEY (trh_cycle_entry_id);


--
-- Name: trh_entry trh_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_entry
    ADD CONSTRAINT trh_entry_pkey PRIMARY KEY (trh_entry_id);


--
-- Name: bobbin_entries unique_bobbin_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries
    ADD CONSTRAINT unique_bobbin_no UNIQUE (bobbin_no);


--
-- Name: d2_batch_id_seq uq_d2_batch_id_seq_scope; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_batch_id_seq
    ADD CONSTRAINT uq_d2_batch_id_seq_scope UNIQUE (series, chamber, seq_date, seq);


--
-- Name: d2_batch_id_seq uq_d2_batch_id_seq_value; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_batch_id_seq
    ADD CONSTRAINT uq_d2_batch_id_seq_value UNIQUE (d2_batch_id);


--
-- Name: d2_issue_draft uq_d2_issue_draft_bobbin; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue_draft
    ADD CONSTRAINT uq_d2_issue_draft_bobbin UNIQUE (bobbin_no);


--
-- Name: preform_accept uq_preform_accept_preform_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT uq_preform_accept_preform_id UNIQUE (preform_id);


--
-- Name: user_departments user_departments_emp_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_emp_id_department_id_key UNIQUE (emp_id, department_id);


--
-- Name: user_departments user_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (emp_id);


--
-- Name: wi_ch_entry wi_ch_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_ch_entry
    ADD CONSTRAINT wi_ch_entry_pkey PRIMARY KEY (wi_ch_id);


--
-- Name: wi_day_entry wi_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_day_entry
    ADD CONSTRAINT wi_day_entry_pkey PRIMARY KEY (wi_day_entry_id);


--
-- Name: wi_entry wi_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_entry
    ADD CONSTRAINT wi_entry_pkey PRIMARY KEY (wi_entry_id);


--
-- Name: winding_observation winding_observation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winding_observation
    ADD CONSTRAINT winding_observation_pkey PRIMARY KEY (wind_obs_id);


--
-- Name: aat_ch_entry_aat_entry_id_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX aat_ch_entry_aat_entry_id_uidx ON public.aat_ch_entry USING btree (aat_entry_id);


--
-- Name: draw_break_analysis_fiber_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX draw_break_analysis_fiber_id ON public.draw_break_analysis USING btree (fiber_id);


--
-- Name: draw_entry_indication_fiber_cut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX draw_entry_indication_fiber_cut ON public.draw_entry USING btree (indication_fiber_cut);


--
-- Name: draw_entry_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX draw_entry_preform_id ON public.draw_entry USING btree (preform_id);


--
-- Name: draw_entry_spool_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX draw_entry_spool_fid ON public.draw_entry USING btree (spool_fid);


--
-- Name: draw_flaw_details_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX draw_flaw_details_spool_id ON public.draw_flaw_details USING btree (spool_id);


--
-- Name: fg_color_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_color_bobbin_fid ON public.fg_color USING btree (bobbin_fid);


--
-- Name: fg_color_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_color_bobbin_no ON public.fg_color USING btree (bobbin_no);


--
-- Name: fg_color_col_jcard_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_color_col_jcard_no ON public.fg_color USING btree (col_jcard_no);


--
-- Name: fg_color_last_child_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_color_last_child_fid ON public.fg_color USING btree (last_child_fid);


--
-- Name: fg_rewind_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_rewind_bobbin_fid ON public.fg_rewind USING btree (bobbin_fid);


--
-- Name: fg_rewind_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_rewind_bobbin_no ON public.fg_rewind USING btree (bobbin_no);


--
-- Name: fg_rewind_last_child_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fg_rewind_last_child_fid ON public.fg_rewind USING btree (last_child_fid);


--
-- Name: grade_mandatory_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX grade_mandatory_grade ON public.grade_mandatory USING btree (grade);


--
-- Name: grade_mandatory_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX grade_mandatory_product_type ON public.grade_mandatory USING btree (product_type);


--
-- Name: h2_ageing_bobbin_bo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX h2_ageing_bobbin_bo ON public.h2_ageing USING btree (bobbin_no);


--
-- Name: h2_ageing_d2_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX h2_ageing_d2_batch_id ON public.h2_ageing USING btree (d2_batch_id);


--
-- Name: h2_ageing_h2_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX h2_ageing_h2_batch_id ON public.h2_ageing USING btree (h2_batch_id);


--
-- Name: handle_join_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX handle_join_preform_id ON public.handle_join USING btree (preform_id);


--
-- Name: htha_ch_entry_htha_entry_id_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX htha_ch_entry_htha_entry_id_uidx ON public.htha_ch_entry USING btree (htha_entry_id);


--
-- Name: idx_aat_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aat_bobbin_no ON public.aat_day_entry USING btree (bobbin_no);


--
-- Name: idx_aat_enrty_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aat_enrty_id ON public.aat_ch_entry USING btree (aat_entry_id);


--
-- Name: idx_aat_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aat_entry_id ON public.aat_day_entry USING btree (aat_entry_id);


--
-- Name: idx_aatentry_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aatentry_bobbin_no ON public.aat_entry USING btree (bobbin_no);


--
-- Name: idx_aatentry_format_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aatentry_format_no ON public.aat_entry USING btree (format_no);


--
-- Name: idx_bobbin_entries_d2_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_d2_batch_id ON public.bobbin_entries USING btree (d2_batch_id);


--
-- Name: idx_bobbin_entries_drawn_length; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_drawn_length ON public.bobbin_entries USING btree (drawn_length);


--
-- Name: idx_bobbin_entries_fiber_length; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_fiber_length ON public.bobbin_entries USING btree (fiber_length);


--
-- Name: idx_bobbin_entries_final_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_final_grade ON public.bobbin_entries USING btree (final_grade);


--
-- Name: idx_bobbin_entries_h2_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_h2_batch_id ON public.bobbin_entries USING btree (h2_batch_id);


--
-- Name: idx_bobbin_entries_optical_length; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_optical_length ON public.bobbin_entries USING btree (optical_length);


--
-- Name: idx_bobbin_entries_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_preform_id ON public.bobbin_entries USING btree (preform_id);


--
-- Name: idx_bobbin_entries_spool_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_spool_fid ON public.bobbin_entries USING btree (spool_fid);


--
-- Name: idx_bobbin_entries_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_spool_id ON public.bobbin_entries USING btree (spool_id);


--
-- Name: idx_bobbin_entries_temp_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bobbin_entries_temp_grade ON public.bobbin_entries USING btree (temp_grade);


--
-- Name: idx_col_material_code_color; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_col_material_code_color ON public.col_material_code USING btree (color);


--
-- Name: idx_coloring_entry_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_coloring_entry_bobbin_no ON public.coloring_entry USING btree (bobbin_no);


--
-- Name: idx_coloring_entry_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_coloring_entry_fid ON public.coloring_entry USING btree (fid);


--
-- Name: idx_coloring_entry_parent_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_coloring_entry_parent_bobbin_no ON public.coloring_entry USING btree (parent_bobbin_no);


--
-- Name: idx_customer_complaint_customer_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_complaint_customer_name ON public.customer_complaint USING btree (customer_name);


--
-- Name: idx_customer_complaint_po_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_complaint_po_no ON public.customer_complaint USING btree (po_no);


--
-- Name: idx_d2_batch_id_seq_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_d2_batch_id_seq_scope ON public.d2_batch_id_seq USING btree (series, chamber, seq_date);


--
-- Name: idx_d2_gas_entry_d2_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_d2_gas_entry_d2_batch_id ON public.d2_gas_entry USING btree (d2_batch_id);


--
-- Name: idx_d2_issue_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_d2_issue_bobbin_fid ON public.d2_issue USING btree (bobbin_fid);


--
-- Name: idx_d2_issue_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_d2_issue_bobbin_no ON public.d2_issue USING btree (bobbin_no);


--
-- Name: idx_d2_issue_d2_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_d2_issue_d2_batch_id ON public.d2_issue USING btree (d2_batch_id);


--
-- Name: idx_f_cable_cable_cutoff_fiber_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_f_cable_cable_cutoff_fiber_id ON public.f_cable_cable_cutoff USING btree (fiber_id);


--
-- Name: idx_f_mbend_history_fiber_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_f_mbend_history_fiber_id ON public.f_mbend_history USING btree (fiber_id);


--
-- Name: idx_function_reports_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_function_reports_active ON public.function_reports USING btree (is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_function_reports_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_function_reports_section ON public.function_reports USING btree (section) WHERE (deleted_at IS NULL);


--
-- Name: idx_mail_drafts_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mail_drafts_created_by ON public.mail_drafts USING btree (created_by);


--
-- Name: idx_process_order_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_order_material ON public.process_order USING btree (material_code) WHERE (is_active = true);


--
-- Name: idx_pt_entry_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pt_entry_spool_id ON public.pt_entry USING btree (spool_id);


--
-- Name: idx_pt_entry_spool_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pt_entry_spool_start ON public.pt_entry USING btree (spool_id, start_length);


--
-- Name: idx_qc_entry_spec_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qc_entry_spec_priority ON public.qc_grade USING btree (product_type, priority);


--
-- Name: idx_report_execution_log_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_execution_log_report ON public.report_execution_log USING btree (report_id);


--
-- Name: idx_report_execution_log_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_execution_log_user ON public.report_execution_log USING btree (executed_by);


--
-- Name: idx_report_master_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_master_module ON public.report_master USING btree (module) WHERE (is_deleted = false);


--
-- Name: idx_report_master_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_master_status ON public.report_master USING btree (status) WHERE (is_deleted = false);


--
-- Name: idx_report_permissions_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_permissions_entity ON public.report_permissions USING btree (permission_type, entity_id);


--
-- Name: idx_report_permissions_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_permissions_report ON public.report_permissions USING btree (report_id);


--
-- Name: idx_report_saved_filters_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_saved_filters_report ON public.report_saved_filters USING btree (report_id, user_id);


--
-- Name: idx_report_section_mapping_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_section_mapping_report ON public.report_section_mapping USING btree (report_id);


--
-- Name: idx_report_section_mapping_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_section_mapping_section ON public.report_section_mapping USING btree (section_id);


--
-- Name: idx_report_sheets_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_sheets_report_id ON public.report_sheets USING btree (report_id);


--
-- Name: idx_report_tables_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_tables_report_id ON public.report_tables USING btree (report_id);


--
-- Name: idx_report_tables_sheet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_tables_sheet_id ON public.report_tables USING btree (sheet_id);


--
-- Name: idx_sap_log_correlation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_correlation ON public.sap_transaction_log USING btree (correlation_id);


--
-- Name: idx_sap_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_created_at ON public.sap_transaction_log USING btree (created_at DESC);


--
-- Name: idx_sap_log_inspection; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_inspection ON public.sap_transaction_log USING btree (inspection_lot);


--
-- Name: idx_sap_log_mat_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_mat_doc ON public.sap_transaction_log USING btree (material_document);


--
-- Name: idx_sap_log_operation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_operation ON public.sap_transaction_log USING btree (operation);


--
-- Name: idx_sap_log_prod_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_prod_order ON public.sap_transaction_log USING btree (prod_order);


--
-- Name: idx_sap_log_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_log_status ON public.sap_transaction_log USING btree (status);


--
-- Name: idx_scheduled_mails_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scheduled_mails_created_by ON public.scheduled_mails USING btree (created_by);


--
-- Name: idx_scheduled_mails_pending; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scheduled_mails_pending ON public.scheduled_mails USING btree (status, next_run_at) WHERE ((status)::text = 'pending'::text);


--
-- Name: idx_spool_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spool_logs_date ON public.pt_machine_logs USING btree (start_date);


--
-- Name: idx_tc_detail_bobbin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_detail_bobbin ON public.tc_detail USING btree (bobbin_no);


--
-- Name: idx_tc_detail_tc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_detail_tc ON public.tc_detail USING btree (tc_id);


--
-- Name: idx_tc_header_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_header_number ON public.tc_header USING btree (tc_number);


--
-- Name: idx_tc_header_packing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_header_packing ON public.tc_header USING btree (packing_order);


--
-- Name: idx_transactions_pending; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_pending ON public.transactions USING btree (transaction_id) WHERE (status = false);


--
-- Name: mat_stock_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mat_stock_batch_id ON public.mat_stock USING btree (batch_id);


--
-- Name: mat_stock_m_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mat_stock_m_code ON public.mat_stock USING btree (m_code);


--
-- Name: order_comp_material_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_comp_material_code ON public.order_comp USING btree (material_code);


--
-- Name: order_comp_order_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_comp_order_no ON public.order_comp USING btree (order_no);


--
-- Name: order_conf_order_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_conf_order_no ON public.order_conf USING btree (order_no);


--
-- Name: order_hdr_material_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_hdr_material_code ON public.order_hdr USING btree (material_code);


--
-- Name: order_opr_order_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_opr_order_no ON public.order_opr USING btree (order_no);


--
-- Name: packing_order_bobbin_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX packing_order_bobbin_bobbin_no ON public.packing_order_bobbin USING btree (bobbin_no);


--
-- Name: packing_order_bobbin_box_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX packing_order_bobbin_box_no ON public.packing_order_bobbin USING btree (box_no);


--
-- Name: packing_order_bobbin_packing_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX packing_order_bobbin_packing_order ON public.packing_order_bobbin USING btree (packing_order);


--
-- Name: packing_order_bobbin_stack_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX packing_order_bobbin_stack_no ON public.packing_order_bobbin USING btree (stack_no);


--
-- Name: packing_order_order_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX packing_order_order_no ON public.packing_order USING btree (order_no);


--
-- Name: preform_accept_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX preform_accept_preform_id ON public.preform_accept USING btree (preform_id);


--
-- Name: preform_allocation_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX preform_allocation_preform_id ON public.preform_allocation USING btree (preform_id);


--
-- Name: process_order_material_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX process_order_material_code ON public.process_order USING btree (material_code);


--
-- Name: process_order_process_o_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX process_order_process_o_no ON public.process_order USING btree (process_o_no);


--
-- Name: pt_allocation_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_allocation_preform_id ON public.pt_allocation USING btree (preform_id);


--
-- Name: pt_allocation_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_allocation_spool_id ON public.pt_allocation USING btree (spool_id);


--
-- Name: pt_entry_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_entry_bobbin_no ON public.pt_entry USING btree (bobbin_no);


--
-- Name: pt_entry_doc_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_entry_doc_id ON public.pt_entry USING btree (doc_id);


--
-- Name: pt_entry_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_entry_fid ON public.pt_entry USING btree (fid);


--
-- Name: pt_entry_preform_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_entry_preform_id ON public.pt_entry USING btree (preform_id);


--
-- Name: pt_entry_rejection_reason; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_entry_rejection_reason ON public.pt_entry USING btree (rejection_reason);


--
-- Name: pt_entry_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_entry_spool_id ON public.pt_entry USING btree (spool_id);


--
-- Name: pt_flaw_details_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_flaw_details_spool_id ON public.pt_flaw_details USING btree (spool_id);


--
-- Name: pt_machine_logs_spool_code_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pt_machine_logs_spool_code_po ON public.pt_machine_logs USING btree (spool_code_po);


--
-- Name: pv_entries_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_entries_bobbin_fid ON public.pv_entries USING btree (bobbin_fid);


--
-- Name: pv_entries_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_entries_bobbin_no ON public.pv_entries USING btree (bobbin_no);


--
-- Name: pv_entries_prefrm_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_entries_prefrm_id ON public.pv_entries USING btree (preform_id);


--
-- Name: pv_entries_spool_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_entries_spool_fid ON public.pv_entries USING btree (spool_fid);


--
-- Name: pv_entries_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_entries_spool_id ON public.pv_entries USING btree (spool_id);


--
-- Name: qc_entry_final_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_entry_final_grade ON public.qc_entry USING btree (final_grade);


--
-- Name: qc_entry_temp_final_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_entry_temp_final_grade ON public.qc_entry_temp USING btree (final_grade);


--
-- Name: qc_entry_temp_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_entry_temp_grade ON public.qc_entry USING btree (temp_grade);


--
-- Name: qc_entry_temp_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_entry_temp_product_type ON public.qc_entry_temp USING btree (product_type);


--
-- Name: qc_entry_temp_temp_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_entry_temp_temp_grade ON public.qc_entry_temp USING btree (temp_grade);


--
-- Name: qc_grade_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_grade_product_type ON public.qc_grade USING btree (product_type);


--
-- Name: qc_grade_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_grade_status ON public.qc_grade USING btree (status) WHERE (status = true);


--
-- Name: qc_out_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_out_bobbin_fid ON public.qc_out USING btree (bobbin_fid);


--
-- Name: qc_out_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX qc_out_bobbin_no ON public.qc_out USING btree (bobbin_no);


--
-- Name: rewind_instr_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rewind_instr_bobbin_fid ON public.rewind_instr USING btree (bobbin_fid);


--
-- Name: rewind_instr_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rewind_instr_bobbin_no ON public.rewind_instr USING btree (bobbin_no);


--
-- Name: rewinding_entry_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rewinding_entry_bobbin_no ON public.rewinding_entry USING btree (bobbin_no);


--
-- Name: rewinding_entry_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rewinding_entry_fid ON public.rewinding_entry USING btree (fid);


--
-- Name: rewinding_entry_parent_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rewinding_entry_parent_bobbin_no ON public.rewinding_entry USING btree (parent_bobbin_no);


--
-- Name: spec_mandatory_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX spec_mandatory_product_type ON public.spec_mandatory USING btree (product_type);


--
-- Name: spec_mandatory_spec_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX spec_mandatory_spec_id ON public.spec_mandatory USING btree (spec_id);


--
-- Name: spec_master_color; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX spec_master_color ON public.spec_master USING btree (color);


--
-- Name: spec_master_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX spec_master_product_type ON public.spec_master USING btree (product_type);


--
-- Name: tc_detail_bobbin_fid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tc_detail_bobbin_fid ON public.tc_detail USING btree (bobbin_fid);


--
-- Name: tc_detail_box_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tc_detail_box_no ON public.tc_detail USING btree (box_no);


--
-- Name: tc_detail_stack_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tc_detail_stack_no ON public.tc_detail USING btree (stack_no);


--
-- Name: tc_header_packing_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tc_header_packing_order ON public.tc_header USING btree (packing_order);


--
-- Name: tc_header_tc_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tc_header_tc_number ON public.tc_header USING btree (tc_number);


--
-- Name: transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transactions_status ON public.transactions USING btree (status) WHERE (status = false);


--
-- Name: tray_master_tray_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tray_master_tray_no ON public.tray_master USING btree (tray_no);


--
-- Name: tray_position_bobbin_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tray_position_bobbin_no ON public.tray_position USING btree (bobbin_no);


--
-- Name: tray_position_position_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tray_position_position_no ON public.tray_position USING btree (position_no);


--
-- Name: tray_position_tray_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tray_position_tray_id ON public.tray_position USING btree (tray_id);


--
-- Name: trh_ch_entry_trh_entry_id_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX trh_ch_entry_trh_entry_id_uidx ON public.trh_ch_entry USING btree (trh_entry_id);


--
-- Name: wi_ch_entry_wi_entry_id_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wi_ch_entry_wi_entry_id_uidx ON public.wi_ch_entry USING btree (wi_entry_id);


--
-- Name: aat_day_entry aat_day_entry_aat_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_day_entry
    ADD CONSTRAINT aat_day_entry_aat_entry_id_fkey FOREIGN KEY (aat_entry_id) REFERENCES public.aat_entry(aat_entry_id) ON DELETE CASCADE;


--
-- Name: bom_master bom_master_component_material_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master
    ADD CONSTRAINT bom_master_component_material_code_fkey FOREIGN KEY (component_material_code) REFERENCES public.material_master(material_code);


--
-- Name: d_fiber_cut_reasons d_fiber_cut_reasons_indication_fiber_cut_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons
    ADD CONSTRAINT d_fiber_cut_reasons_indication_fiber_cut_id_fkey FOREIGN KEY (indication_fiber_cut_id) REFERENCES public.fiber_cut_indication(indication_fiber_cut_id);


--
-- Name: draw_entry draw_entry_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT draw_entry_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: draw_flaw_details draw_flaw_details_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details
    ADD CONSTRAINT draw_flaw_details_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.draw_entry(spool_id);


--
-- Name: dyanmic_fartique_speed dyanmic_fartique_speed_dynamic_fartique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique_speed
    ADD CONSTRAINT dyanmic_fartique_speed_dynamic_fartique_id_fkey FOREIGN KEY (dynamic_fartique_id) REFERENCES public.dyanmic_fartique(dynamic_fartique_id) ON DELETE CASCADE;


--
-- Name: pt_allocation fk_pta_preform_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation
    ADD CONSTRAINT fk_pta_preform_id FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: pt_allocation fk_pta_spool_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation
    ADD CONSTRAINT fk_pta_spool_id FOREIGN KEY (spool_id) REFERENCES public.draw_entry(spool_id);


--
-- Name: function_reports function_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.function_reports
    ADD CONSTRAINT function_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(emp_id);


--
-- Name: handle_join handle_join_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join
    ADD CONSTRAINT handle_join_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: hot_water_day_entry hot_water_day_entry_hot_water_entry_id_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_day_entry
    ADD CONSTRAINT hot_water_day_entry_hot_water_entry_id_entry_id_fkey FOREIGN KEY (hot_water_entry_id) REFERENCES public.hot_water_entry(hot_water_entry_id) ON DELETE CASCADE;


--
-- Name: htha_day_entry htha_day_entry_htha_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_day_entry
    ADD CONSTRAINT htha_day_entry_htha_entry_id_fkey FOREIGN KEY (htha_entry_id) REFERENCES public.htha_entry(htha_entry_id) ON DELETE CASCADE;


--
-- Name: master_preform_type master_preform_type_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(emp_id);


--
-- Name: packing_order_bobbin packing_order_bobbin_packing_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin
    ADD CONSTRAINT packing_order_bobbin_packing_order_fkey FOREIGN KEY (packing_order) REFERENCES public.packing_order(order_no);


--
-- Name: preform_accept preform_accept_logged_in_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT preform_accept_logged_in_user_fkey FOREIGN KEY (logged_in_user) REFERENCES public.users(emp_id);


--
-- Name: preform_allocation preform_allocation_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: preform_process_type_mapping preform_process_type_mapping_process_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping
    ADD CONSTRAINT preform_process_type_mapping_process_type_id_fkey FOREIGN KEY (process_type_id) REFERENCES public.process_type_master(process_type_id) ON DELETE CASCADE;


--
-- Name: report_execution_log report_execution_log_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_execution_log
    ADD CONSTRAINT report_execution_log_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id);


--
-- Name: report_permissions report_permissions_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_permissions
    ADD CONSTRAINT report_permissions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_saved_filters report_saved_filters_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_saved_filters
    ADD CONSTRAINT report_saved_filters_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_section_mapping report_section_mapping_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_section_mapping report_section_mapping_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.report_section_master(section_id) ON DELETE CASCADE;


--
-- Name: report_sheets report_sheets_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sheets
    ADD CONSTRAINT report_sheets_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_tables report_tables_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables
    ADD CONSTRAINT report_tables_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_tables report_tables_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables
    ADD CONSTRAINT report_tables_sheet_id_fkey FOREIGN KEY (sheet_id) REFERENCES public.report_sheets(id) ON DELETE CASCADE;


--
-- Name: report_version_history report_version_history_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_version_history
    ADD CONSTRAINT report_version_history_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id);


--
-- Name: tc_detail tc_detail_tc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_detail
    ADD CONSTRAINT tc_detail_tc_id_fkey FOREIGN KEY (tc_id) REFERENCES public.tc_header(tc_id);


--
-- Name: temp_cycle_entry temp_cycle_entry_temp_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_cycle_entry
    ADD CONSTRAINT temp_cycle_entry_temp_entry_id_fkey FOREIGN KEY (temp_entry_id) REFERENCES public.temp_entry(temp_entry_id) ON DELETE CASCADE;


--
-- Name: tray_position tray_position_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.tray_master(tray_id);


--
-- Name: trh_cycle_entry trh_cycle_entry_trh_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_cycle_entry
    ADD CONSTRAINT trh_cycle_entry_trh_entry_id_fkey FOREIGN KEY (trh_entry_id) REFERENCES public.trh_entry(trh_entry_id) ON DELETE CASCADE;


--
-- Name: user_departments user_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: user_departments user_departments_emp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_emp_id_fkey FOREIGN KEY (emp_id) REFERENCES public.users(emp_id) ON DELETE CASCADE;


--
-- Name: wi_ch_entry wi_ch_entry_wi_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_ch_entry
    ADD CONSTRAINT wi_ch_entry_wi_entry_id_fkey FOREIGN KEY (wi_entry_id) REFERENCES public.wi_entry(wi_entry_id) ON DELETE CASCADE;


--
-- Name: wi_day_entry wi_day_entry_wi_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_day_entry
    ADD CONSTRAINT wi_day_entry_wi_entry_id_fkey FOREIGN KEY (wi_entry_id) REFERENCES public.wi_entry(wi_entry_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict MyGwg8V8zLg1RUDs5i45dy8Bzbq0du3NElJ3zdsZSxYv5ragSCK7EwpuyxstKRd

