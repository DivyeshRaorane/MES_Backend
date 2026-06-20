-- Master table for Product Types (dropdown)

CREATE TABLE master_product_type (
    product_type_id SERIAL PRIMARY KEY,
    product_type_name VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'A', 'B'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
