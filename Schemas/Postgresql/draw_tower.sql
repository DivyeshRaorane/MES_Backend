-- Draw Tower master table

CREATE TABLE draw_tower (
    tower_id SERIAL PRIMARY KEY,
    tower_no INT NOT NULL UNIQUE,
    furnace_count INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
