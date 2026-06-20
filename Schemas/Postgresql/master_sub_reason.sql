-- Master table for Sub Reason & Next Sub Reason (dropdown in pt_break_analysis)

CREATE TABLE master_sub_reason (
    sub_reason_id SERIAL PRIMARY KEY,
    sub_reason_name VARCHAR(100) NOT NULL,
    reason_level VARCHAR(10) NOT NULL DEFAULT 'sub' CHECK (reason_level IN ('sub', 'next_sub')),
    parent_break_type_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_break_type_id) REFERENCES master_main_break_type(break_type_id)
);
