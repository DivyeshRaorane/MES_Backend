CREATE TABLE d2_gas_entry(
    d2_gas_id SERIAL PRIMARY KEY,
    d2_batch_id VARCHAR(20) NOT NULL,
    d2_chamber_id INT NOT NULL,
    gas_concentration 
    gas_cons_fresh 
    gas_cons_used
    gas_cons_n2
    tank_pressure
    gas_issue_date DATE DEFAULT CURRENT_DATE,
    gas_issee_time TIME DEFAULT CURRENT_TIME,

    cycle_time 
    d2_gas_operator_id INT NOT NULL,
    total_bobbins INT NOT NULL,

    logged_in_user INT NOT NULL,
    created_at TIMESTAMP CURRENT_TIMESTAMP

    CONSTRAINT fk_d2_batch_id_d2_gas_entry FOREIGN KEY (d2_batch_id) REFERENCES d2_issue(d2_batch_id),
    CONSTRAINT fk_logged_in_user_d2_gas_entry FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)

)