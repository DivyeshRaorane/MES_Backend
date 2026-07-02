-- FID Grid data (child table of colouring_entry)

CREATE TABLE colouring_fid_grid (
    fid_grid_id SERIAL PRIMARY KEY,
    colouring_id INT NOT NULL,
    fid VARCHAR(30) NOT NULL,
    rewinding_length DECIMAL(10,3),
    scrap_length DECIMAL(10,3),
    balance DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cfg_colouring FOREIGN KEY (colouring_id) REFERENCES colouring_entry(colouring_id) ON DELETE CASCADE
);
