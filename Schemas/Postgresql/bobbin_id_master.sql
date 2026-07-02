CREATE TABLE bobbin_id_master(
    bobbin_id VARCHAR(20) PRIMARY KEY,
    fid VARCHAR(20) UNIQUE,
    pt_length DECIMAL(10,2) NOT NULL,
    pt_material_code VARCHAR(20) NOT NULL,

    logged_in_user INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)