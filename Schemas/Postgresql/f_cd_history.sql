CREATE TABLE f_cd_history (
    id SERIAL PRIMARY KEY,
    bobbin_id VARCHAR(100) NOT NULL,
    length DECIMAL(12,3),
    measurement_date DATE,
    measurement_time TIME,
    wavelength DECIMAL(10,3),
    delay DECIMAL(12,3),
    dispersion DECIMAL(10,3),
    slope DECIMAL(10,3)
);