-- Child table: Rewinding Instructions (multiple rows per rewinding_entry)
-- Columns: instruction (checkbox selected), length_km

CREATE TABLE rewinding_instructions (
    instruction_id SERIAL PRIMARY KEY,
    rewinding_id INT NOT NULL,
    instruction TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    length_km DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rewinding_id) REFERENCES rewinding_entry(rewinding_id) ON DELETE CASCADE
);
