CREATE TABLE d2_gas_entry(
    d2_gas_id SERIAL PRIMARY KEY,
    d2_batch_id VARCHAR(20) UNIQUE NOT NULL,
    d2_chamber INT NOT NULL,
    gas_concentration DECIMAL(10,3) NOT NULL,
    fresh_gas DECIMAL(10,3) NOT NULL, 
    used_gas DECIMAL(10,3) NOT NULL
    n2_gas DECIMAL(10,3) NOT NULL,
    tank_pressure DECIMAL(10,3),
    gas_issue_date DATE ,
    gas_issee_time TIME ,

    cycle_time_min INT, 
    d2_gas_operator VARCHAR(50),
    total_bobbins INT,

    logged_in_user INT NOT NULL,
    created_at TIMESTAMP CURRENT_TIMESTAMP

)