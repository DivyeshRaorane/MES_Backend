CREATE TABLE spec_master (
    spec_id              SERIAL PRIMARY KEY,

    customer_name        VARCHAR(150) NOT NULL,
    po_number            VARCHAR(100),
    pt_strain            INT,
    cust_spec_name       VARCHAR(200) NOT NULL,
    product_type         VARCHAR(100),
    coating_type         VARCHAR(20),
    quantity_km          NUMERIC(12,3),
    color                VARCHAR(50),

    priority             INTEGER DEFAULT 1,

    remarks              TEXT,

    is_active            BOOLEAN DEFAULT TRUE,

    created_by           INTEGER,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);