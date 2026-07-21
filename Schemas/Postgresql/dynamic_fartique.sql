CREATE TABLE dyanmic_fartique(
    dynamic_fartique_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50),
    format_no VARCHAR(100),
    gr_clause_no DECIMAL(10,3),
    title VARCHAR(200),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)