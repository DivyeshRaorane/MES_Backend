-- Master table for Bobbin Type (dropdown in pt_entry, rewinding/colouring)

CREATE TABLE master_bobbin_type (
    bobbin_type_id SERIAL PRIMARY KEY,
    bobbin_type_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
