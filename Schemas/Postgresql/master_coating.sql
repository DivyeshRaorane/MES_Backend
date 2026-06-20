-- Master table for Coatings (dropdown: Primary Coating, Secondary Coating, Coating Type)

CREATE TABLE master_coating (
    coating_id SERIAL PRIMARY KEY,
    coating_name VARCHAR(100) NOT NULL,
    coating_category VARCHAR(30) NOT NULL CHECK (coating_category IN ('primary', 'secondary', 'type')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
