-- PT Process Log (child table of pt_entry)
-- Multiple rows per pt_entry: barcode/id/flaw, length, reason

CREATE TABLE pt_process_log (
    pt_process_log_id SERIAL PRIMARY KEY,
    pt_entry_id INT NOT NULL,
    barcode_or_flaw VARCHAR(50),
    length DECIMAL(10,3),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ptpl_entry FOREIGN KEY (pt_entry_id) REFERENCES pt_entry(pt_entry_id) ON DELETE CASCADE
);
