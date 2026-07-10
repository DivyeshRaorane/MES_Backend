CREATE TABLE customer_table(
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150),
    customer_since DATE,
    disable BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)