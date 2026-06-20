-- Child table: Colouring Instructions (multiple rows per colouring_entry)

CREATE TABLE colouring_instructions (
    instruction_id SERIAL PRIMARY KEY,
    colouring_id INT NOT NULL,
    instruction TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    length_km DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (colouring_id) REFERENCES colouring_entry(colouring_id) ON DELETE CASCADE
);
