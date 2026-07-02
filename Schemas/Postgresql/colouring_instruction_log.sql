-- Colouring Instructions selected (child table of colouring_entry)

CREATE TABLE colouring_instruction_log (
    col_instruction_log_id SERIAL PRIMARY KEY,
    colouring_id INT NOT NULL,
    instruction_id INT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    length_km DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cil_colouring FOREIGN KEY (colouring_id) REFERENCES colouring_entry(colouring_id) ON DELETE CASCADE,
    CONSTRAINT fk_cil_instruction FOREIGN KEY (instruction_id) REFERENCES master_rew_instruction(instruction_id)
);
