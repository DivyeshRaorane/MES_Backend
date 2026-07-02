-- Length Allocation Details (child table of rewinding_entry)
-- Multiple rows: length, fid, barcode/scrap_id, start_pos, end_pos

CREATE TABLE rewinding_length_allocation (
    length_alloc_id SERIAL PRIMARY KEY,
    rewinding_id INT NOT NULL,
    sr_no INT,
    length DECIMAL(10,3),
    fid VARCHAR(30),
    barcode_scrap_id VARCHAR(50),
    start_pos DECIMAL(10,3),
    end_pos DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rla_rewinding FOREIGN KEY (rewinding_id) REFERENCES rewinding_entry(rewinding_id) ON DELETE CASCADE
);
