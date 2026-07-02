CREATE TABLE material_master(
    material_code VARCHAR(50) PRIMARY KEY,
    material_category VARCHAR(50) NOT NULL,
    material_description TEXT NOT NULL,
    preform_type VARCHAR(50),
    product_type VARCHAR(50),
    uom VARCHAR(10) NOT NULL,

    is_sample BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);