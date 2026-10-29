--This Two functions are use for Draw Dashboard Report

CREATE OR REPLACE FUNCTION fn_draw_dashboard(
    p_default_plan NUMERIC DEFAULT 10000
)
RETURNS TABLE (
    day TEXT,
    plan NUMERIC,
    dt_prod NUMERIC,
    diff NUMERIC,
    dt_yield NUMERIC,
    dt_scrap NUMERIC,
    dt_brk_10k NUMERIC
) AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Directly calculate and assign inside the function body
    v_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_end_date := CURRENT_DATE;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::date AS day_val
    ),
    aggregated_logs AS (
        SELECT 
            entry_date,
            SUM(COALESCE(drawn_length, 0)) AS dt_prod,
            SUM(COALESCE(top_end_scrap, 0) + COALESCE(bottom_end_scrap, 0)) AS total_scrap,
            SUM(CASE WHEN indication_fiber_cut = 'Draw Break' THEN 1 ELSE 0 END) AS draw_breaks
        FROM draw_entry
        WHERE entry_date BETWEEN v_start_date AND v_end_date
        GROUP BY entry_date
    ),
    daily_calculated AS (
        SELECT 
            ds.day_val,
            p_default_plan AS plan,
            COALESCE(al.dt_prod, 0) AS dt_prod,
            (p_default_plan - COALESCE(al.dt_prod, 0)) AS diff,
            COALESCE(al.total_scrap, 0) AS total_scrap,
            COALESCE(al.draw_breaks, 0) AS draw_breaks,
            -- DT Yield %
            CASE 
                WHEN COALESCE(al.dt_prod, 0) > 0 THEN 
                    ROUND(100.0 - ((COALESCE(al.total_scrap, 0) / al.dt_prod) * 100.0), 2)
                ELSE 100.0 
            END AS dt_yield,
            -- DT Scrap %
            CASE 
                WHEN COALESCE(al.dt_prod, 0) > 0 THEN 
                    ROUND((COALESCE(al.total_scrap, 0) / al.dt_prod) * 100.0, 2)
                ELSE 0.0 
            END AS dt_scrap,
            -- DT Break per 10k
            CASE 
                WHEN COALESCE(al.dt_prod, 0) > 0 THEN 
                    ROUND((COALESCE(al.draw_breaks, 0)::numeric / al.dt_prod) * 10000.0, 2)
                ELSE 0.0 
            END AS dt_brk_10k
        FROM date_series ds
        LEFT JOIN aggregated_logs al ON ds.day_val = al.entry_date
    )
    -- 1. Daily Rows
    SELECT 
        TO_CHAR(dc.day_val, 'DD.MM.YYYY') AS day,
        dc.plan,
        dc.dt_prod,
        dc.diff,
        dc.dt_yield,
        dc.dt_scrap,
        dc.dt_brk_10k
    FROM daily_calculated dc
    
    UNION ALL
    
    -- 2. Total Row at the bottom
    SELECT 
        'Total' AS day,
        SUM(dc.plan) AS plan,
        SUM(dc.dt_prod) AS dt_prod,
        SUM(dc.diff) AS diff,
        CASE 
            WHEN SUM(dc.dt_prod) > 0 THEN 
                ROUND(100.0 - ((SUM(dc.total_scrap) / SUM(dc.dt_prod)) * 100.0), 2)
            ELSE 100.0 
        END AS dt_yield,
        CASE 
            WHEN SUM(dc.dt_prod) > 0 THEN 
                ROUND((SUM(dc.total_scrap) / SUM(dc.dt_prod)) * 100.0, 2)
            ELSE 0.0 
        END AS dt_scrap,
        CASE 
            WHEN SUM(dc.dt_prod) > 0 THEN 
                ROUND((SUM(dc.draw_breaks)::numeric / SUM(dc.dt_prod)) * 10000.0, 2)
            ELSE 0.0 
        END AS dt_brk_10k
    FROM daily_calculated dc;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_dt_production_report(
    p_default_plan NUMERIC DEFAULT 10000
)
RETURNS TABLE (
    Dt_Machine VARCHAR,
    Total_Dt NUMERIC,
    Dt_Ok NUMERIC,
    Dt_Break BIGINT,
    Draw_Scrap NUMERIC
) AS $$
DECLARE
    v_end_date DATE;
BEGIN
    -- Automatically set to current date internally
    v_end_date := CURRENT_DATE;

    RETURN QUERY
    -- 1. Machine-wise breakdown rows
    SELECT 
        de.tower_no::VARCHAR AS Dt_Machine,
        SUM(COALESCE(de.drawn_length, 0)) AS Total_Dt,
        -- DT OK = Total DT minus (Top Scrap + Bottom Scrap)
        (SUM(COALESCE(de.drawn_length, 0)) - SUM(COALESCE(de.top_end_scrap, 0) + COALESCE(de.bottom_end_scrap, 0))) AS Dt_Ok,
        -- DT Break = Count of rows where indication_fiber_cut = 'Draw Break'
        SUM(CASE WHEN de.indication_fiber_cut = 'Draw Break' THEN 1 ELSE 0 END) AS Dt_Break,
        -- Draw Scrap = Sum of top_end_scrap + bottom_end_scrap
        SUM(COALESCE(de.top_end_scrap, 0) + COALESCE(de.bottom_end_scrap, 0)) AS Draw_Scrap
    FROM draw_entry de
    WHERE de.entry_date = v_end_date
    GROUP BY de.tower_no
    
    UNION ALL
    
    -- 2. Total Row at the bottom
    SELECT 
        'Total' AS Dt_Machine,
        SUM(COALESCE(de.drawn_length, 0)) AS Total_Dt,
        SUM(COALESCE(de.drawn_length, 0) - (COALESCE(de.top_end_scrap, 0) + COALESCE(de.bottom_end_scrap, 0))) AS Dt_Ok,
        SUM(CASE WHEN de.indication_fiber_cut = 'Draw Break' THEN 1 ELSE 0 END) AS Dt_Break,
        SUM(COALESCE(de.top_end_scrap, 0) + COALESCE(de.bottom_end_scrap, 0)) AS Draw_Scrap
    FROM draw_entry de
    WHERE de.entry_date = v_end_date;

END;
$$ LANGUAGE plpgsql;

SELECT * FROM fn_dt_production_report();

--This below two functions for PT Dashboard

CREATE OR REPLACE FUNCTION fn_pt_dashboard(
    p_default_plan NUMERIC DEFAULT 10000
)
RETURNS TABLE (
    day TEXT,
    plan NUMERIC,
    pt_prod NUMERIC,
    diff NUMERIC,
    pt_yield NUMERIC,
    pt_scrap NUMERIC,
    pt_brk_1k NUMERIC
) AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Automatically calculate current month start date to today
    v_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_end_date := CURRENT_DATE;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::date AS day_val
    ),
    aggregated_logs AS (
        SELECT 
            pe.created_at::date AS entry_date,
            SUM(COALESCE(pe.pt_length, 0)) AS sum_pt_prod,
            -- Sum pt_length where fid IS NULL to get total scrap length
            SUM(CASE WHEN pe.fid IS NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END) AS sum_total_scrap,
            -- Count breaks where fid IS NOT NULL and is_break = true
            SUM(CASE WHEN pe.fid IS NOT NULL AND pe.is_break = TRUE THEN 1 ELSE 0 END) AS sum_pt_breaks
        FROM pt_entry pe
        WHERE pe.created_at::date BETWEEN v_start_date AND v_end_date
        GROUP BY pe.created_at::date
    ),
    daily_calculated AS (
        SELECT 
            ds.day_val,
            p_default_plan AS calc_plan,
            COALESCE(al.sum_pt_prod, 0) AS calc_pt_prod,
            (p_default_plan - COALESCE(al.sum_pt_prod, 0)) AS calc_diff,
            COALESCE(al.sum_total_scrap, 0) AS calc_total_scrap,
            COALESCE(al.sum_pt_breaks, 0) AS calc_pt_breaks,
            -- PT Yield %
            CASE 
                WHEN COALESCE(al.sum_pt_prod, 0) > 0 THEN 
                    ROUND(100.0 - ((COALESCE(al.sum_total_scrap, 0) / al.sum_pt_prod) * 100.0), 2)
                ELSE 100.0 
            END AS calc_pt_yield,
            -- PT Scrap %
            CASE 
                WHEN COALESCE(al.sum_pt_prod, 0) > 0 THEN 
                    ROUND((COALESCE(al.sum_total_scrap, 0) / al.sum_pt_prod) * 100.0, 2)
                ELSE 0.0 
            END AS calc_pt_scrap,
            -- PT Break per 1k
            CASE 
                WHEN COALESCE(al.sum_pt_prod, 0) > 0 THEN 
                    ROUND((COALESCE(al.sum_pt_breaks, 0)::numeric / al.sum_pt_prod) * 1000.0, 2)
                ELSE 0.0 
            END AS calc_pt_brk_1k
        FROM date_series ds
        LEFT JOIN aggregated_logs al ON ds.day_val = al.entry_date
    )
    -- 1. Daily Rows
    SELECT 
        TO_CHAR(dc.day_val, 'DD.MM.YYYY') AS day,
        dc.calc_plan AS plan,
        dc.calc_pt_prod AS pt_prod,
        dc.calc_diff AS diff,
        dc.calc_pt_yield AS pt_yield,
        dc.calc_pt_scrap AS pt_scrap,
        dc.calc_pt_brk_1k AS pt_brk_1k
    FROM daily_calculated dc
    
    UNION ALL
    
    -- 2. Total Row at the bottom
    SELECT 
        'Total' AS day,
        SUM(dc.calc_plan) AS plan,
        SUM(dc.calc_pt_prod) AS pt_prod,
        SUM(dc.calc_diff) AS diff,
        CASE 
            WHEN SUM(dc.calc_pt_prod) > 0 THEN 
                ROUND(100.0 - ((SUM(dc.calc_total_scrap) / SUM(dc.calc_pt_prod)) * 100.0), 2)
            ELSE 100.0 
        END AS pt_yield,
        CASE 
            WHEN SUM(dc.calc_pt_prod) > 0 THEN 
                ROUND((SUM(dc.calc_total_scrap) / SUM(dc.calc_pt_prod)) * 100.0, 2)
            ELSE 0.0 
        END AS pt_scrap,
        CASE 
            WHEN SUM(dc.calc_pt_prod) > 0 THEN 
                ROUND((SUM(dc.calc_pt_breaks)::numeric / SUM(dc.calc_pt_prod)) * 1000.0, 2)
            ELSE 0.0 
        END AS pt_brk_1k
    FROM daily_calculated dc;

END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_pt_production_report(
    p_default_plan NUMERIC DEFAULT 10000
)
RETURNS TABLE (
    Pt_Machine INTEGER,
    Total_Pt NUMERIC,
    Pt_Ok NUMERIC,
    Pt_Break BIGINT,
    Pt_Scrap NUMERIC
) AS $$
DECLARE
    v_end_date DATE;
BEGIN
    -- Automatically set to current date internally
    v_end_date := CURRENT_DATE;

    RETURN QUERY
    -- 1. Machine-wise breakdown rows
    SELECT 
        pe.pt_machine::INTEGER AS Pt_Machine,
        SUM(COALESCE(pe.pt_length, 0)) AS Total_Pt,
        -- PT OK = Total PT minus PT Scrap (sum of pt_length where fid IS NULL)
        (SUM(COALESCE(pe.pt_length, 0)) - SUM(CASE WHEN pe.fid IS NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END)) AS Pt_Ok,
        -- PT Break = Count of rows where fid IS NOT NULL and is_break = true
        SUM(CASE WHEN pe.fid IS NOT NULL AND pe.is_break = TRUE THEN 1 ELSE 0 END) AS Pt_Break,
        -- PT Scrap = Sum of pt_length where fid IS NULL
        SUM(CASE WHEN pe.fid IS NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END) AS Pt_Scrap
    FROM pt_entry pe
    WHERE pe.created_at::date = v_end_date
    GROUP BY pe.pt_machine
    
    UNION ALL
    
    -- 2. Total Row at the bottom
    SELECT 
        NULL::INTEGER AS Pt_Machine,
        SUM(COALESCE(pe.pt_length, 0)) AS Total_Pt,
        SUM(COALESCE(pe.pt_length, 0) - (CASE WHEN pe.fid IS NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END)) AS Pt_Ok,
        SUM(CASE WHEN pe.fid IS NOT NULL AND pe.is_break = TRUE THEN 1 ELSE 0 END) AS Pt_Break,
        SUM(CASE WHEN pe.fid IS NULL THEN COALESCE(pe.pt_length, 0) ELSE 0 END) AS Pt_Scrap
    FROM pt_entry pe
    WHERE pe.created_at::date = v_end_date;

END;
$$ LANGUAGE plpgsql;


-- Below two functions for coloring_dashboard report


CREATE OR REPLACE FUNCTION fn_coloring_dashboard(
    p_default_plan NUMERIC DEFAULT 10000
)
RETURNS TABLE (
    day TEXT,
    plan NUMERIC,
    col_prod NUMERIC,
    diff NUMERIC,
    col_yield NUMERIC,
    col_scrap NUMERIC
) AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Automatically calculate current month start date to today
    v_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_end_date := CURRENT_DATE;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::date AS day_val
    ),
    aggregated_logs AS (
        SELECT 
            ce.entry_date,
            SUM(COALESCE(ce.fiber_length, 0)) AS sum_col_prod,
            -- Scrap length is the sum of fiber_length where is_scrap is TRUE
            SUM(CASE WHEN ce.is_scrap = TRUE THEN COALESCE(ce.fiber_length, 0) ELSE 0 END) AS sum_total_scrap
        FROM coloring_entry ce
        WHERE ce.entry_date BETWEEN v_start_date AND v_end_date
        GROUP BY ce.entry_date
    ),
    daily_calculated AS (
        SELECT 
            ds.day_val,
            p_default_plan AS calc_plan,
            COALESCE(al.sum_col_prod, 0) AS calc_col_prod,
            (p_default_plan - COALESCE(al.sum_col_prod, 0)) AS calc_diff,
            COALESCE(al.sum_total_scrap, 0) AS calc_total_scrap,
            -- Coloring Yield %
            CASE 
                WHEN COALESCE(al.sum_col_prod, 0) > 0 THEN 
                    ROUND(100.0 - ((COALESCE(al.sum_total_scrap, 0) / al.sum_col_prod) * 100.0), 2)
                ELSE 100.0 
            END AS calc_col_yield,
            -- Coloring Scrap %
            CASE 
                WHEN COALESCE(al.sum_col_prod, 0) > 0 THEN 
                    ROUND((COALESCE(al.sum_total_scrap, 0) / al.sum_col_prod) * 100.0, 2)
                ELSE 0.0 
            END AS calc_col_scrap
        FROM date_series ds
        LEFT JOIN aggregated_logs al ON ds.day_val = al.entry_date
    )
    -- 1. Daily Rows
    SELECT 
        TO_CHAR(dc.day_val, 'DD.MM.YYYY') AS day,
        dc.calc_plan AS plan,
        dc.calc_col_prod AS col_prod,
        dc.calc_diff AS diff,
        dc.calc_col_yield AS col_yield,
        dc.calc_col_scrap AS col_scrap
    FROM daily_calculated dc
    
    UNION ALL
    
    -- 2. Total Row at the bottom
    SELECT 
        'Total' AS day,
        SUM(dc.calc_plan) AS plan,
        SUM(dc.calc_col_prod) AS col_prod,
        SUM(dc.calc_diff) AS diff,
        CASE 
            WHEN SUM(dc.calc_col_prod) > 0 THEN 
                ROUND(100.0 - ((SUM(dc.calc_total_scrap) / SUM(dc.calc_col_prod)) * 100.0), 2)
            ELSE 100.0 
        END AS col_yield,
        CASE 
            WHEN SUM(dc.calc_col_prod) > 0 THEN 
                ROUND((SUM(dc.calc_total_scrap) / SUM(dc.calc_col_prod)) * 100.0, 2)
            ELSE 0.0 
        END AS col_scrap
    FROM daily_calculated dc;

END;
$$ LANGUAGE plpgsql;

SELECT * FROM fn_coloring_dashboard();



CREATE OR REPLACE FUNCTION fn_coloring_production_report(
    p_default_plan NUMERIC DEFAULT 10000
)
RETURNS TABLE (
    Machine_No INTEGER,
    Total_Col NUMERIC,
    Col_Ok NUMERIC,
    Col_Scrap NUMERIC
) AS $$
DECLARE
    v_end_date DATE;
BEGIN
    -- Automatically set to current date internally
    v_end_date := CURRENT_DATE;

    RETURN QUERY
    -- 1. Machine-wise breakdown rows
    SELECT 
        ce.machine_no::INTEGER AS Machine_No,
        COALESCE(SUM(COALESCE(ce.fiber_length, 0)), 0) AS Total_Col,
        -- Col OK = Total Coloring minus Scrap
        COALESCE(SUM(COALESCE(ce.fiber_length, 0)) - SUM(CASE WHEN ce.is_scrap = TRUE THEN COALESCE(ce.fiber_length, 0) ELSE 0 END), 0) AS Col_Ok,
        -- Col Scrap = Sum of fiber_length where is_scrap = TRUE
        COALESCE(SUM(CASE WHEN ce.is_scrap = TRUE THEN COALESCE(ce.fiber_length, 0) ELSE 0 END), 0) AS Col_Scrap
    FROM coloring_entry ce
    WHERE ce.entry_date = v_end_date
    GROUP BY ce.machine_no
    
    UNION ALL
    
    -- 2. Total Row at the bottom (guarantees 0 instead of NULL if no records exist for the date)
    SELECT 
        NULL::INTEGER AS Machine_No,
        COALESCE(SUM(COALESCE(ce.fiber_length, 0)), 0) AS Total_Col,
        COALESCE(SUM(COALESCE(ce.fiber_length, 0) - (CASE WHEN ce.is_scrap = TRUE THEN COALESCE(ce.fiber_length, 0) ELSE 0 END)), 0) AS Col_Ok,
        COALESCE(SUM(CASE WHEN ce.is_scrap = TRUE THEN COALESCE(ce.fiber_length, 0) ELSE 0 END), 0) AS Col_Scrap
    FROM coloring_entry ce
    WHERE ce.entry_date = v_end_date;

END;
$$ LANGUAGE plpgsql;

SELECT * FROM fn_coloring_production_report();


