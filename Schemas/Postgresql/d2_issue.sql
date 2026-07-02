CREATE TABLE d2_issue(
    d2_isseue_id SERIAL PRIMARY KEY,
    d2_batch_id VARCHAR(20) UNIQUE NOT NULL,
    start_operator_id INT NOT NULL,
    d2_start_date DATE DEFAULT CURRENT_DATE,
    d2_start_time TIME DEFAULT CURRENT_TIME,
    d2_end_date DATE DEFAULT CURRENT_DATE,
    d2_end_time TIME DEFAULT CURRENT_TIME,
    end_operator_id INT,
    fid VARCHAR(20) UNIQUE,
    chamber_id INT NOT NULL,
    process_hours INT NOT NULL,


    logged_in_user INT NOT NULL,
    created_at TIMESTAMP CURRENT_TIMESTAMP,

    CONSTRAINT fk_fid_d2_issue FOREIGN KEY (fid) bobbin_id_master(fid),
    CONSTRAINT fk_chamber_no_d2_issue FOREIGN KEY (chamber_id) d2_chambers(chamber_id),
    CONSTRAINT fk_logged_in_user_d2_issue FOREIGN KEY (logged_in_user) users(emp_id)
)