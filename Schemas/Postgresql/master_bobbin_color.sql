-- Master table for Bobbin Color (dropdown in pt_entry, rewinding/colouring)

CREATE TABLE master_bobbin_color (
    bobbin_color_id SERIAL PRIMARY KEY,
    color_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
