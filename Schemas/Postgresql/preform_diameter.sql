-- Preform diameter measurements (part of handle_join screen)

CREATE TABLE preform_diameter (
    diameter_id SERIAL PRIMARY KEY,
    preform_id VARCHAR(20) NOT NULL,
    dia1 DECIMAL(10,2),
    dia2 DECIMAL(10,2),
    dia3 DECIMAL(10,2),
    dia4 DECIMAL(10,2),
    dia5 DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (preform_id) REFERENCES preform_data(preform_id) ON DELETE CASCADE
);
