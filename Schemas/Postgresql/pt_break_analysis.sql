-- Screen: PT BREAK ANALYSIS
-- URL: /prooftesting/ptbreakanalysis
-- Header: entry_date, bsa_technician (dropdown), brk_pt_id, main_break_type (dropdown),
--         sub_reason (dropdown), next_sub_reason (dropdown), dist_from_periphery,
--         particle_size, flaw_size, preform_type, pt_len (km), draw_cumm_len (km),
--         tower_no, pt_mc_no, pt_operator, draw_barcode_id,
--         preform_id, pt_breaks, breaks_checked, pending, spool_id, bsa_remark
-- Analysis Data Logs (child): sr_no, spool_id, pt_breaks, break_checked, pt_brks/k(1000), bsa_%

CREATE TABLE pt_break_analysis (
    break_analysis_id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    bsa_technician_id INT NOT NULL,
    brk_pt_id VARCHAR(50),
    main_break_type_id INT,
    sub_reason_id INT,
    next_sub_reason_id INT,
    dist_from_periphery DECIMAL(10,2),
    particle_size DECIMAL(10,2),
    flaw_size DECIMAL(10,2),
    preform_type_id INT,
    pt_len_km DECIMAL(10,3),
    draw_cumm_len_km DECIMAL(10,3),
    tower_id INT,
    pt_mc_id INT,
    pt_operator_id INT,
    draw_barcode_id VARCHAR(50),
    preform_id VARCHAR(20),
    pt_breaks INT DEFAULT 0,
    breaks_checked INT DEFAULT 0,
    pending INT DEFAULT 0,
    spool_id VARCHAR(50),
    bsa_remark TEXT,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date_ts DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bsa_technician_id) REFERENCES master_bsa_technician(technician_id),
    FOREIGN KEY (main_break_type_id) REFERENCES master_main_break_type(break_type_id),
    FOREIGN KEY (sub_reason_id) REFERENCES master_sub_reason(sub_reason_id),
    FOREIGN KEY (next_sub_reason_id) REFERENCES master_sub_reason(sub_reason_id),
    FOREIGN KEY (preform_type_id) REFERENCES master_preform_type(preform_type_id),
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id),
    FOREIGN KEY (pt_mc_id) REFERENCES master_pt_machine(machine_id),
    FOREIGN KEY (pt_operator_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (preform_id) REFERENCES preform_data(preform_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
);
