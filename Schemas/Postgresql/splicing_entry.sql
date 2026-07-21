CREATE TABLE splicing_entry(
    splicing_id SERIAL PRIMARY KEY,
    bobbin_a_no VARCHAR(50),
    bobbin_b_no VARCHAR(50),
    machine_loss DECIMAL(10,3),
    product_type VARCHAR(50),
    brand_name VARCHAR(50),
    remark TEXT,

    a_1310 DECIMAL(10,3),
    a_1550 DECIMAL(10,3),
    a_1625 DECIMAL(10,3),

    b_1310 DECIMAL(10,3),
    b_1550 DECIMAL(10,3),
    b_1625 DECIMAL(10,3),

    ave_loss_1310 DECIMAL(10,3),
    ave_loss_1550 DECIMAL(10,3),
    ave_loss_1625 DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
)