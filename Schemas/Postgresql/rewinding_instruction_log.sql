-- Rewinding Instructions selected (child table of rewinding_entry)
-- Multiple checkboxes with instruction + length

CREATE TABLE rewinding_instruction_log (
    rew_instruction_log_id SERIAL PRIMARY KEY,
    rewinding_id INT NOT NULL,
    instruction_id INT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    length_km DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ril_rewinding FOREIGN KEY (rewinding_id) REFERENCES rewinding_entry(rewinding_id) ON DELETE CASCADE,
    CONSTRAINT fk_ril_instruction FOREIGN KEY (instruction_id) REFERENCES master_rew_instruction(instruction_id)
);
