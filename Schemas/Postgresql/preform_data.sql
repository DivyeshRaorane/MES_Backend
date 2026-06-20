-- Preform master data (base preform info from SAP/ERP)

CREATE TABLE preform_data (
    preform_id VARCHAR(20) PRIMARY KEY,
    preform_weight DECIMAL(10,3),
    preform_type_id INT,
    material_code VARCHAR(20),
    material_description TEXT,
    plant VARCHAR(10),
    storage_location VARCHAR(10),
    uom VARCHAR(10) DEFAULT 'KG',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

);
