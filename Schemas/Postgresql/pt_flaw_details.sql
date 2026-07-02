-- Draw Flaw Log (child table of pt_entry)
-- Multiple rows: draw_flaw, pos1, pos2, defect_length, actual_cut_length

CREATE TABLE pt_flaw_details (
    pt_flaw_id SERIAL PRIMARY KEY,
    pt_entry_id INT NOT NULL,
    spool_id VARCHAR(20) NOT NULL,
    draw_flaw TEXT,
    pos1 DECIMAL(10,3),
    pos2 DECIMAL(10,3),
    defect_length DECIMAL(10,3),
    actual_cut_length DECIMAL(10,3),

    logged_in_user VARCHAR(50) NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ptf_entry FOREIGN KEY (pt_entry_id) REFERENCES pt_entry(pt_entry_id) ON DELETE CASCADE,
    CONSTRAINT fk_ptf_spool FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id),
    CONSTRAINT fk_ptf_logged_in_user FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)
);
