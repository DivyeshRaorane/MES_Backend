CREATE TABLE packing_order (
    packing_order_id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    required_km DECIMAL(10,2),

    box_capacity INT NOT NULL,
    stack_capacity INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);