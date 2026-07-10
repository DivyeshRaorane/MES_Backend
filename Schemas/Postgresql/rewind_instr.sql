CREATE TABLE rewind_instr(
    rewind_instr_id SERIAL PRIMARY KEY,
    bobbin_id VARCHAR(50),
    bobbin_id VARCHAR(50),
    p1 DECIMAL(10,3),
    p2 DECIMAL(10,3),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)