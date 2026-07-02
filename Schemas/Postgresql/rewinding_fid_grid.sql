-- FID Grid data (child table of rewinding_entry)
-- Shows: fid, rewinding length, scrap length, balance (multiple rows)

CREATE TABLE rewinding_fid_grid (
    fid_grid_id SERIAL PRIMARY KEY,
    rewinding_id INT NOT NULL,
    fid VARCHAR(30) NOT NULL,
    rewinding_length DECIMAL(10,3),
    scrap_length DECIMAL(10,3),
    balance DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rfg_rewinding FOREIGN KEY (rewinding_id) REFERENCES rewinding_entry(rewinding_id) ON DELETE CASCADE
);
