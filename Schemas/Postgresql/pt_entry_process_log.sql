-- Child table: PT Process Log (multiple rows per pt_entry)
-- Columns: barcode/id/flaw, length, reason

CREATE TABLE pt_entry_process_log (
    process_log_id SERIAL PRIMARY KEY,
    pt_entry_id INT NOT NULL,
    barcode_id_flaw VARCHAR(100),
    length DECIMAL(10,3),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pt_entry_id) REFERENCES pt_entry(pt_entry_id) ON DELETE CASCADE
);
