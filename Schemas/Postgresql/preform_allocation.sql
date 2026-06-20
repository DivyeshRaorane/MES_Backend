-- Screen 3: PREFORM ALLOCATION
-- Fields: preform_id, allocation_date, tower_no (dropdown), working_shift (dropdown),
--         sequence_no, loading_operator (dropdown), preform_type, product_type (dropdown),
--         process_type (dropdown), draw_instruction, dia1-5, cone_length,
--         average_diameter (calculated), process_remarks
-- Logged in user + entry timestamp

CREATE TABLE preform_allocation (
    allocation_id SERIAL PRIMARY KEY,
    preform_id VARCHAR(20) NOT NULL,
    allocation_date DATE NOT NULL,
    tower_id INT NOT NULL,
    shift_id INT NOT NULL,
    operator_id INT NOT NULL,
    preform_type_id INT,
    product_type_id INT,
    process_type_id INT,
    preform_draw boolean default false,


    -- Measurements (MM)
    
    
    average_diameter DECIMAL(10,2),

    -- Instructions & remarks
    draw_instruction TEXT,
    process_remarks TEXT,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (preform_id) REFERENCES preform_accept(preform_id),
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id),
    --FOREIGN KEY (shift_id) REFERENCES master_shift(shift_id),
    --FOREIGN KEY (operator_id) REFERENCES master_operator(operator_id),
    --FOREIGN KEY (preform_type_id) REFERENCES master_preform_type(preform_type_id),
    --FOREIGN KEY (product_type_id) REFERENCES master_product_type(product_type_id),
    --FOREIGN KEY (process_type_id) REFERENCES master_process_type(process_type_id),
    --FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
);
