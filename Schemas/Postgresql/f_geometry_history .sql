CREATE TABLE f_geometry_history (
    id SERIAL PRIMARY KEY,
    bobbin_id VARCHAR(100),
    length NUMERIC,
    measurement_date DATE,
    measurement_time TIME,
    core_dia_top NUMERIC,
    core_ovality_top NUMERIC,
    core_clad_concentricity_top NUMERIC,
    clad_dia_top NUMERIC,
    clad_ovality_top NUMERIC,
    core_dia_bottom NUMERIC,
    core_ovality_bottom NUMERIC,
    core_clad_concentricity_bottom NUMERIC,
    clad_dia_bottom NUMERIC,
    clad_ovality_bottom NUMERIC,
    Operator VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);