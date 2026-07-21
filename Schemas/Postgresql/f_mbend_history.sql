CREATE TABLE IF NOT EXISTS f_mbend_history (
    id                  SERIAL PRIMARY KEY,
    fiber_id            VARCHAR(50)     NOT NULL,
    measurement_date    DATE,
    measurement_time    VARCHAR(20),
    Operator            VARCHAR(50),
    sample_type         VARCHAR(20),     -- e.g. 'P1'
    turn                NUMERIC,         -- Turn (N)
    mandrel_diameter    NUMERIC,         -- Mandrel Diameter (mm)
    sample_length       NUMERIC,         -- Sample length (m)
    wavelength          NUMERIC,         -- e.g. 1310, 1550, 1625
    attenuation         NUMERIC(10,4),
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_f_mbend_history_fiber_id ON f_mbend_history (fiber_id);