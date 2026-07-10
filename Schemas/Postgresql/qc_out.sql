CREATE TABLE qc_out(
    qc_out_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50) NOT NULL,
    bobbin_fid VARCHAR(50) NOT NULL,
    out_date DATE NOT NULL,
    out_time TIME NOT NULL,
    "user" VARCHAR(50) NOT NULL,
    shift VARCHAR(10) NOT NULL,
    fiber_length DECIMAL(10,3) NOT NULL,

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)