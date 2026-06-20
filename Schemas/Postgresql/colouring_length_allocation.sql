-- Child table: Length Allocation Details (multiple rows per colouring_entry)

CREATE TABLE colouring_length_allocation (
    allocation_id SERIAL PRIMARY KEY,
    colouring_id INT NOT NULL,
    length DECIMAL(10,3),
    fid VARCHAR(50),
    barcode_scrap_id VARCHAR(50),
    start_pos DECIMAL(10,2),
    end_pos DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (colouring_id) REFERENCES colouring_entry(colouring_id) ON DELETE CASCADE
);
