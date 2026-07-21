CREATE TABLE IF NOT EXISTS f_cable_cable_cutoff (
    id                  SERIAL PRIMARY KEY,
    fiber_id            VARCHAR(50)     NOT NULL,
    length              NUMERIC(10,2),
    measurement_date    DATE,
    measurement_time    VARCHAR(20),
    Operator            VARCHAR(50),
    cable_cutoff_flag   VARCHAR(5),      -- 'YES' or 'NO' as read from the file
    cutoff_wavelength   NUMERIC(10,2),   -- the Cut-off Wavelength (nm) value from the file
    target_column       VARCHAR(30),     -- 'cable_cut_off' or 'fiber_cut_off_top'
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_f_cable_cable_cutoff_fiber_id ON f_cable_cable_cutoff (fiber_id);