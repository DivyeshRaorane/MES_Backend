-- Screen 1: PREFORM ACCEPTANCE
-- Fields: preform_id, preform_weight, charge_weight, preform_length, charge_length,
--         drawing_length, material_code, dia_variation, cut_off, mfd, accepted_by (dropdown),
--         preform_type (dropdown), material_description, remarks, draw_instruction,
--         acceptance_status (accept/reject), rejection_note
-- Logged in user + entry timestamp tracked

CREATE TABLE preform_accept (
    acceptance_id SERIAL PRIMARY KEY,
    preform_id VARCHAR(20) UNIQUE NOT NULL,
    preform_weight DECIMAL(10,3),
    charge_weight DECIMAL(10,3),
    preform_length DECIMAL(10,2),
    charge_length DECIMAL(10,2),
    drawing_length DECIMAL(10,2),
    material_code VARCHAR(20),
    dia_variation DECIMAL(10,2),
    cut_off DECIMAL(10,2),
    mfd DECIMAL(10,2),
    accepted_by INT ,
    preform_type_id INT,
    material_description TEXT,
    remarks TEXT,
    draw_instruction TEXT,
    is_handle_join boollean default false not null,
    acceptance_status VARCHAR(10) NOT NULL DEFAULT 'accepted' CHECK (acceptance_status IN ('accepted', 'rejected')),
    rejection_note TEXT,

    -- Logged in user and entry time
    logged_in_user VARCHAR(50),
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
    FOREIGN KEY (accepted_by) REFERENCES draw_users(draw_user_id)
);


also i want to make fk for accepted_by and preform_type_id
