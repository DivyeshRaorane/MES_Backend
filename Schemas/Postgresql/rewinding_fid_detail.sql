-- Child table: FID detail rows (DFG table showing rewinding/scrap/balance)
-- Multiple rows per rewinding_entry

CREATE TABLE rewinding_fid_detail (
    fid_detail_id SERIAL PRIMARY KEY,
    rewinding_id INT NOT NULL,
    dfg_id VARCHAR(50),
    rewinding_value DECIMAL(10,3),
    scrap_value DECIMAL(10,3),
    balance_value DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rewinding_id) REFERENCES rewinding_entry(rewinding_id) ON DELETE CASCADE
);
