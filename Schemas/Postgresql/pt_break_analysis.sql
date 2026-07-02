-- Screen: PT BREAK ANALYSIS (localhost:5173/prooftesting/ptbreakanalysis)
-- PT Break Analysis Entry:
--   entry_date, bsa_technician (dropdown), brk_pt_id, main_break_type (dropdown),
--   sub_reason (dropdown), next_sub_reason (dropdown), dist_from_periphery, particle_size,
--   flaw_size, preform_type, pt_len (km), draw_cumm_len (km), tower_no, pt_mc_no,
--   pt_operator, draw_barcode_id, preform_id, pt_breaks, breaks_checked, pending,
--   spool_id, bsa_remark
-- Analysis Data Logs (auto-generated list):
--   sr_no, spool_id, pt_breaks, break_checked, pt_brks/k(1000), bsa_%

CREATE TABLE pt_break_analysis (
    break_analysis_id SERIAL PRIMARY KEY,
    entry_date DATE DEFAULT CURRENT_DATE,
    bsa_technician_id INT,
    brk_pt_id VARCHAR(30),
    main_break_type_id INT,
    sub_reason_id INT,
    next_sub_reason_id INT,
    dist_from_periphery DECIMAL(10,2),
    particle_size VARCHAR(50),
    flaw_size VARCHAR(50),
    preform_type VARCHAR(50),
    pt_len_km DECIMAL(10,3),
    draw_cumm_len_km DECIMAL(10,3),
    tower_no INT,
    pt_mc_no INT,
    pt_operator VARCHAR(100),
    draw_barcode_id VARCHAR(50),
    preform_id VARCHAR(20),
    pt_breaks INT DEFAULT 0,
    breaks_checked INT DEFAULT 0,
    pending INT DEFAULT 0,
    spool_id VARCHAR(20),
    bsa_remark TEXT,

    -- Logged in user and entry time
    logged_in_user VARCHAR(50) NOT NULL,
    entry_date_ts DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ptba_technician FOREIGN KEY (bsa_technician_id) REFERENCES master_bsa_technician(bsa_tech_id),
    CONSTRAINT fk_ptba_break_type FOREIGN KEY (main_break_type_id) REFERENCES master_break_type(break_type_id),
    CONSTRAINT fk_ptba_sub_reason FOREIGN KEY (sub_reason_id) REFERENCES master_break_sub_reason(sub_reason_id),
    CONSTRAINT fk_ptba_next_sub_reason FOREIGN KEY (next_sub_reason_id) REFERENCES master_break_sub_reason(sub_reason_id),
    CONSTRAINT fk_ptba_spool FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id),
    CONSTRAINT fk_ptba_logged_in_user FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)
);
