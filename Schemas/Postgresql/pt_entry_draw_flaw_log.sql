-- Child table: Draw Flaw Log (multiple rows per pt_entry)
-- Columns: draw_flaw, pos1, pos2, defect_len, act_cut_len

CREATE TABLE pt_entry_draw_flaw_log (
    flaw_log_id SERIAL PRIMARY KEY,
    pt_entry_id INT NOT NULL,
    draw_flaw VARCHAR(100),
    pos1 DECIMAL(10,2),
    pos2 DECIMAL(10,2),
    defect_len DECIMAL(10,2),
    act_cut_len DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pt_entry_id) REFERENCES pt_entry(pt_entry_id) ON DELETE CASCADE
);
