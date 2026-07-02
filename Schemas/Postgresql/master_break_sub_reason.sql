-- Master table for Sub Reason & Next Sub Reason (dropdowns in pt_break_analysis)

CREATE TABLE master_break_sub_reason (
    sub_reason_id SERIAL PRIMARY KEY,
    sub_reason_name VARCHAR(100) NOT NULL,
    break_type_id INT,
    is_next_sub BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sub_reason_break_type FOREIGN KEY (break_type_id) REFERENCES master_break_type(break_type_id)
);
