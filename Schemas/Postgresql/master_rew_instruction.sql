-- Master table for Rewinding Instructions (checkbox list in rewinding screen)

CREATE TABLE master_rew_instruction (
    instruction_id SERIAL PRIMARY KEY,
    instruction_text VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
