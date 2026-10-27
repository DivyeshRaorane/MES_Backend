CREATE OR REPLACE FUNCTION fn_draw_dashboard(
    p_start_date DATE,
    p_end_date DATE,
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
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, INTERVAL '1 day')::date AS day_val
    ),
    aggregated_logs AS (
        SELECT 
            entry_date,
            SUM(COALESCE(drawn_length, 0)) AS dt_prod,
            SUM(COALESCE(top_end_scrap, 0) + COALESCE(bottom_end_scrap, 0)) AS total_scrap,
            SUM(CASE WHEN indication_fiber_cut = 'Draw Break' THEN 1 ELSE 0 END) AS draw_breaks
        FROM draw_entry
        WHERE entry_date BETWEEN p_start_date AND p_end_date
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
    -- 1. Daily Rows (Formatted as DD.MM.YYYY to match your Excel sheet)
    SELECT 
        TO_CHAR(day_val, 'DD.MM.YYYY') AS day,
        plan,
        dt_prod,
        diff,
        dt_yield,
        dt_scrap,
        dt_brk_10k
    FROM daily_calculated
    
    UNION ALL
    
    -- 2. Total Row at the bottom
    SELECT 
        'Total' AS day,
        SUM(plan) AS plan,
        SUM(dt_prod) AS dt_prod,
        SUM(diff) AS diff,
        CASE 
            WHEN SUM(dt_prod) > 0 THEN 
                ROUND(100.0 - ((SUM(total_scrap) / SUM(dt_prod)) * 100.0), 2)
            ELSE 100.0 
        END AS dt_yield,
        CASE 
            WHEN SUM(dt_prod) > 0 THEN 
                ROUND((SUM(total_scrap) / SUM(dt_prod)) * 100.0, 2)
            ELSE 0.0 
        END AS dt_scrap,
        CASE 
            WHEN SUM(dt_prod) > 0 THEN 
                ROUND((SUM(draw_breaks)::numeric / SUM(dt_prod)) * 10000.0, 2)
            ELSE 0.0 
        END AS dt_brk_10k
    FROM daily_calculated;

END;
$$ LANGUAGE plpgsql;