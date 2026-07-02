CREATE TABLE d2_chambers(
    d2_chamber_id SERIAL PRIMARY KEY,
    d2_chamber_name VARCHAR(20) NOT NULL,
    chamber_capacity INT NOT NULL,
    is_active BOOlEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    
)