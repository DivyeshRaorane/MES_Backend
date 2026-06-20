-- Master table for Batches (dropdown: Primary Batch, Secondary Batch)

CREATE TABLE master_batch (
    batch_id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    batch_category VARCHAR(20) NOT NULL CHECK (batch_category IN ('primary', 'secondary')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
