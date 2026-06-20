-- Screen 7: DRAW TIMELOSS ENTRY
-- Header: floor (radio: furnace_floor / ground_floor), date, shift (dropdown),
--         phase (dropdown), operator (dropdown), shift_incharge (dropdown)
-- Rows per DT:
--   Shift Entry: ls_th, line_speed, plan, total_drawn
--   Time Loss: time_loss, break_count
--   Furnace Floor Operator: no_of_co, no_of_join_ts, no_of_s/c, f/c, c/o
--   Ground Floor Operator: pna_pm, start_up, ru, bad, bbd, bac, maint, utility, process, eot, be_lf
-- Logged in user + entry timestamp

-- Header table
CREATE TABLE draw_timeloss_entry (
    timeloss_id SERIAL PRIMARY KEY,
    floor_type VARCHAR(20) NOT NULL CHECK (floor_type IN ('furnace_floor', 'ground_floor')),
    entry_date DATE NOT NULL,
    shift_id INT NOT NULL,
    phase_id INT,
    operator_id INT,
    shift_incharge_id INT,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date_ts DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (shift_id) REFERENCES master_shift(shift_id),
    FOREIGN KEY (phase_id) REFERENCES master_phase(phase_id),
    FOREIGN KEY (operator_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (shift_incharge_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
);

-- Detail rows (one per draw tower per timeloss entry)
CREATE TABLE draw_timeloss_detail (
    timeloss_detail_id SERIAL PRIMARY KEY,
    timeloss_id INT NOT NULL,
    tower_id INT NOT NULL,

    -- Shift Entry columns
    ls_th DECIMAL(10,2) DEFAULT 0,
    line_speed DECIMAL(10,2) DEFAULT 0,
    plan DECIMAL(10,2) DEFAULT 0,
    total_drawn DECIMAL(10,2) DEFAULT 0,

    -- Time Loss
    time_loss DECIMAL(10,2) DEFAULT 0,
    break_count INT DEFAULT 0,

    -- Furnace Floor Operator
    no_of_co INT DEFAULT 0,
    no_of_join_ts INT DEFAULT 0,
    no_of_sc INT DEFAULT 0,
    fc INT DEFAULT 0,
    co INT DEFAULT 0,

    -- Ground Floor Operator
    pna_pm DECIMAL(10,2) DEFAULT 0,
    start_up DECIMAL(10,2) DEFAULT 0,
    ru DECIMAL(10,2) DEFAULT 0,
    bad DECIMAL(10,2) DEFAULT 0,
    bbd DECIMAL(10,2) DEFAULT 0,
    bac DECIMAL(10,2) DEFAULT 0,
    maint DECIMAL(10,2) DEFAULT 0,
    utility DECIMAL(10,2) DEFAULT 0,
    process DECIMAL(10,2) DEFAULT 0,
    eot DECIMAL(10,2) DEFAULT 0,
    be_lf DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (timeloss_id) REFERENCES draw_timeloss_entry(timeloss_id) ON DELETE CASCADE,
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id)
);
