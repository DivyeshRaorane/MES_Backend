CREATE TABLE spec_parameter (
    spec_parameter_id    SERIAL PRIMARY KEY,

    spec_id              INTEGER NOT NULL
                         REFERENCES spec_master(spec_id)
                         ON DELETE CASCADE,

    parameter_name       VARCHAR(100) NOT NULL,

    min_value            NUMERIC(12,6),

    max_value            NUMERIC(12,6),


    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (spec_id, parameter_name)
);