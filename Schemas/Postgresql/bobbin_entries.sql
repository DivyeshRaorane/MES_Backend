CREATE TABLE bobbin_entries (
    fid_create_id SERIAL PRIMARY KEY,
    fid VARCHAR(100) UNIQUE,
    spool_id VARCHAR(100),
    bobbin_no VARCHAR(100) UNIQUE,
    tower_no VARCHAR(50),
    pt_machine_no VARCHAR(50),

    fiber_length DECIMAL(10,3),
    drawn_date TIMESTAMP,
    pt_date TIMESTAMP,
    drawn_length DECIMAL(10,3),

    operator VARCHAR(100),
    logged_in_user INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_pv BOOLEAN DEFAULT FALSE,

    preform_type VARCHAR(100),
    product_type VARCHAR(100),

    spool_fid VARCHAR(100),
    preform_id VARCHAR(100),

    fiber_type VARCHAR(100),
    fiber_color VARCHAR(50),

    d2_issue VARCHAR(255),
    is_d2 BOOLEAN DEFAULT FALSE,

    is_h2 BOOLEAN DEFAULT FALSE,
    h2_issue VARCHAR(255),

    d2_batch_id VARCHAR(100),
    h2_batch_id VARCHAR(100),

    temp_grade VARCHAR(20),
    final_grade VARCHAR(20),

    lock BOOLEAN DEFAULT FALSE,

    is_qc_out BOOLEAN DEFAULT FALSE,

    dispatch_status VARCHAR(20) DEFAULT 'No',

    is_h2_after BOOLEAN DEFAULT FALSE,

    pt_strain VARCHAR(100),

    ud_grade VARCHAR(20)
);

-- Add ud_grade (SAP UD_CODE returned on a successful Usage Decision)
ALTER TABLE bobbin_entries ADD COLUMN IF NOT EXISTS ud_grade VARCHAR(20);