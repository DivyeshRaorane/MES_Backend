-- Child table: Length Allocation Details (multiple rows per rewinding_entry)
-- Columns: length, fid, barcode/scrap_id, start_pos, end_pos

CREATE TABLE rewinding_length_allocation (
    allocation_id SERIAL PRIMARY KEY,
    rewinding_id INT NOT NULL,
    length DECIMAL(10,3),
    fid VARCHAR(50),
    barcode_scrap_id VARCHAR(50),
    start_pos DECIMAL(10,2),
    end_pos DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rewinding_id) REFERENCES rewinding_entry(rewinding_id) ON DELETE CASCADE
);
