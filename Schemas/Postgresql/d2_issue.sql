CREATE TABLE d2_issue(
    d2_isseue_id SERIAL PRIMARY KEY,
    d2_batch_id VARCHAR(20) UNIQUE NOT NULL,
    start_operator VARCHAR(50),
    d2_start_date DATE DEFAULT CURRENT_DATE,
    d2_start_time TIME DEFAULT CURRENT_TIME,
    d2_end_date DATE DEFAULT CURRENT_DATE,
    d2_end_time TIME DEFAULT CURRENT_TIME,
    end_operator VARCHAR(50) ,
    bobbin_fid VARCHAR(20) UNIQUE,
    bobbin_no  VARCHAR(20) UNIQUE,
    chamber INT NOT NULL,
    process_hours INT NOT NULL,



    logged_in_user INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
)