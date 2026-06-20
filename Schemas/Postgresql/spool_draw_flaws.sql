-- Draw Flaws child table for spool_entry (multiple rows per spool)
-- "Get Draw Flaws" / "+ Add Rows" button on spool entry screen

CREATE TABLE spool_draw_flaws (
    flaw_id SERIAL PRIMARY KEY,
    spool_entry_id INT NOT NULL,
    flaw_position DECIMAL(10,2),
    flaw_type VARCHAR(50),
    flaw_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spool_entry_id) REFERENCES spool_entry(spool_entry_id) ON DELETE CASCADE
);
