CREATE TABLE draw_shift_plan(
    dsp_id SERIAL PRIMARY KEY,
    'date' DATE,
    shift VARCHAR(10),
    die_operator VARCHAR(50),
    ground_operator VARCHAR(50),
    furnace_operator VARCHAR(50),
    shift_incharge VARCHAR(50),

    tower_no INT NOT NULL,
    theo_speed DECIMAL(10,3),
    actu_speed DECIMAL(10,3),
    ch_ov_num INT NOT NULL,
    ch_ov_time DECIMAL(10,3),
    ch_ov_tl DECIMAL(10,3),
    fur_cl_time DECIMAL(10,3),
    pm_tl DECIMAL(10,3),
    downtime DECIMAL(10,3),
    draw_plan DECIMAL(10,3),
    shift_time DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)