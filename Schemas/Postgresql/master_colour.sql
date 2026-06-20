-- Master table for Fibre Colour (used in colouring_entry)

CREATE TABLE master_colour (
    colour_id SERIAL PRIMARY KEY,
    colour_name VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'Blue', 'Red', 'Orange'
    colour_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
