-- Length Allocation Details (child table of colouring_entry)

CREATE TABLE colouring_length_allocation (
    length_alloc_id SERIAL PRIMARY KEY,
    colouring_id INT NOT NULL,
    sr_no INT,
    length DECIMAL(10,3),
    fid VARCHAR(30),
    barcode_scrap_id VARCHAR(50),
    start_pos DECIMAL(10,3),
    end_pos DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cla_colouring FOREIGN KEY (colouring_id) REFERENCES colouring_entry(colouring_id) ON DELETE CASCADE
);
