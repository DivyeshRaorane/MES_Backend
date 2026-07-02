CREATE TABLE mat_stock(
    mat_stock_id SERIAL PRIMARY KEY,
    m_code VARCHAR(20) NOT NULL,
    batch_id VARCHAR(20) NOT NULL,
    uom VARCHAR(10) NOT NULL,
    activity VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);