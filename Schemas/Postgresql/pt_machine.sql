CREATE TABLE pt_machine(
    pt_machine_id SERIAL PRIMARY KEY,
    pt_machine_no INT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);