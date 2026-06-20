-- Child table: FID detail rows for colouring (DFG table)

CREATE TABLE colouring_fid_detail (
    fid_detail_id SERIAL PRIMARY KEY,
    colouring_id INT NOT NULL,
    dfg_id VARCHAR(50),
    rewinding_value DECIMAL(10,3),
    scrap_value DECIMAL(10,3),
    balance_value DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (colouring_id) REFERENCES colouring_entry(colouring_id) ON DELETE CASCADE
);
