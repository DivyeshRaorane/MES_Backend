CREATE TABLE qc_users(
    qc_user_id SERIAL PRIMARY KEY,
    emp_id VARCHAR(20),
    qc_user_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
