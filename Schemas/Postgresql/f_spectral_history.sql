CREATE TABLE f_spectral_history (
    id SERIAL PRIMARY KEY,
    bobbin_id VARCHAR(100),
    length NUMERIC,
    measurement_date DATE,
    measurement_time TIME,
    location VARCHAR(50), -- 'BEFORE' or 'AFTER'
    wavelength NUMERIC,
    attenuation NUMERIC,
    Operator VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
