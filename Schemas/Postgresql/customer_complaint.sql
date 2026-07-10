CREATE TABLE customer_complaint(
    complaint_id PRIMARY KEY,
    complaint_type VARCHAR(50),
    customer_name VARCHAR(100) NOT NULL,
    raised_by INT NOT NULL,
    complaint_date DATE,
    closed_date DATE,
    product_details TEXT,
    po_no VARCHAR(50),
    po_quantity DECIMAL(10,3),
    reject_quantity DECIMAL(10,3),
    shipment_date DATE,
    grn_no VARCHAR(50),
    test_cert_no VARCHAR(10,3),
    complaint_feedBack TEXT,
    complaint_status CHECK('open','close'),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)