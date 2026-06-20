-- Screen 6: DRAW SHIFT REPORT
-- Header: entry_date, shift (dropdown), ground_team (dropdown), furnace_team (dropdown),
--         die_team (dropdown), shift_incharge (dropdown), total_plan, gap, total_draw, total_breaks
-- Rows per DT: plan_fkm, achieved_fkm, gap_fkm, started_by, preform_seq, spool_id,
--              drawn_fkm, dc, fc, break, c/o_timeloss, fc_timeloss, start_up_timeloss,
--              ramp_up_timeloss, cobs_timeloss, activities_issues
-- Logged in user + entry timestamp

-- Header table
CREATE TABLE draw_shift_report (
    report_id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    shift_id INT NOT NULL,
    ground_team_id INT,
    furnace_team_id INT,
    die_team_id INT,
    shift_incharge_id INT,
    total_plan DECIMAL(10,2),
    gap DECIMAL(10,2),
    total_draw DECIMAL(10,2),
    total_breaks DECIMAL(10,2),

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date_ts DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (shift_id) REFERENCES master_shift(shift_id),
    FOREIGN KEY (ground_team_id) REFERENCES master_team(team_id),
    FOREIGN KEY (furnace_team_id) REFERENCES master_team(team_id),
    FOREIGN KEY (die_team_id) REFERENCES master_team(team_id),
    FOREIGN KEY (shift_incharge_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id),

    UNIQUE (entry_date, shift_id)
);

-- Detail rows (one per draw tower per report)
CREATE TABLE draw_shift_report_detail (
    report_detail_id SERIAL PRIMARY KEY,
    report_id INT NOT NULL,
    tower_id INT NOT NULL,
    plan_fkm DECIMAL(10,2) DEFAULT 0,
    achieved_fkm DECIMAL(10,2) DEFAULT 0,
    gap_fkm DECIMAL(10,2) DEFAULT 0,
    started_by VARCHAR(100),
    preform_seq INT,
    spool_id VARCHAR(30),
    drawn_fkm DECIMAL(10,2) DEFAULT 0,
    dc INT DEFAULT 0,
    fc INT DEFAULT 0,
    break_count INT DEFAULT 0,
    co_timeloss DECIMAL(10,2) DEFAULT 0,
    fc_timeloss DECIMAL(10,2) DEFAULT 0,
    start_up_timeloss DECIMAL(10,2) DEFAULT 0,
    ramp_up_timeloss DECIMAL(10,2) DEFAULT 0,
    cobs_timeloss DECIMAL(10,2) DEFAULT 0,
    activities_issues TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (report_id) REFERENCES draw_shift_report(report_id) ON DELETE CASCADE,
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id)
);
