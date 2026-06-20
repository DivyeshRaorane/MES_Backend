-- Screen: PT ALLOCATION
-- URL: /prooftesting/ptallocation
-- Tabs: Allocation Table, PT Running Table, Rejected Spool
-- Fields: scan_drawn_spool_barcode, date, preform_id (auto), dt_no (auto),
--         drawn_length (auto), product_type (auto), select_pt_strain (dropdown),
--         select_pt_machine (dropdown), allocated_by (dropdown), shift_incharge (dropdown),
--         remark
-- Pending Allocation List shows: preform_id, draw_spool_id, dt_no, draw_length, pt_done, balance_length
-- Actions: Allocate / Reject

CREATE TABLE pt_allocation (
    pt_allocation_id SERIAL PRIMARY KEY,
    drawn_spool_barcode VARCHAR(50) NOT NULL,
    allocation_date DATE NOT NULL,
    preform_id VARCHAR(20),
    tower_id INT,
    drawn_length DECIMAL(10,2),
    product_type_id INT,
    pt_strain_id INT NOT NULL,
    pt_machine_id INT NOT NULL,
    allocated_by INT NOT NULL,
    shift_incharge_id INT NOT NULL,
    remark TEXT,
    allocation_status VARCHAR(20) NOT NULL DEFAULT 'allocated' CHECK (allocation_status IN ('allocated', 'rejected')),
    pt_done BOOLEAN DEFAULT FALSE,
    balance_length DECIMAL(10,2),

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (preform_id) REFERENCES preform_data(preform_id),
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id),
    FOREIGN KEY (product_type_id) REFERENCES master_product_type(product_type_id),
    FOREIGN KEY (pt_strain_id) REFERENCES master_pt_strain(strain_id),
    FOREIGN KEY (pt_machine_id) REFERENCES master_pt_machine(machine_id),
    FOREIGN KEY (allocated_by) REFERENCES master_operator(operator_id),
    FOREIGN KEY (shift_incharge_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
);
