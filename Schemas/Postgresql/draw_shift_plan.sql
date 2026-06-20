-- Screen 5: DRAW SHIFT PLAN
-- Header: entry_date, shift (dropdown), die_team (dropdown), ground_team (dropdown),
--         furnace_team (dropdown), shift_incharge (dropdown)
-- Rows per DT: theo_speed, actual_speed, c/o_num, c/o_time, c/o_tl, fc_tl, pm_tl,
--              downtime, draw_plan, shift_time
-- Logged in user + entry timestamp

-- Header table
CREATE TABLE draw_shift_plan (
    plan_id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    shift_id INT NOT NULL,
    die_team_id INT,
    ground_team_id INT,
    furnace_team_id INT,
    shift_incharge_id INT,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date_ts DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (shift_id) REFERENCES master_shift(shift_id),
    FOREIGN KEY (die_team_id) REFERENCES master_team(team_id),
    FOREIGN KEY (ground_team_id) REFERENCES master_team(team_id),
    FOREIGN KEY (furnace_team_id) REFERENCES master_team(team_id),
    FOREIGN KEY (shift_incharge_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id),

    UNIQUE (entry_date, shift_id)
);

-- Detail rows (one per draw tower per plan)
CREATE TABLE draw_shift_plan_detail (
    plan_detail_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    tower_id INT NOT NULL,
    theo_speed DECIMAL(10,2) DEFAULT 0,
    actual_speed DECIMAL(10,2) DEFAULT 0,
    co_num INT DEFAULT 0,
    co_time DECIMAL(10,2) DEFAULT 0,
    co_tl DECIMAL(10,2) DEFAULT 0,
    fc_tl DECIMAL(10,2) DEFAULT 0,
    pm_tl DECIMAL(10,2) DEFAULT 0,
    downtime DECIMAL(10,2) DEFAULT 0,
    draw_plan DECIMAL(10,2) DEFAULT 0,
    shift_time DECIMAL(10,2) DEFAULT 480,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (plan_id) REFERENCES draw_shift_plan(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id)
);
