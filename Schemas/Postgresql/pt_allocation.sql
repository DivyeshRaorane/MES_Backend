-- Screen: PT ALLOCATION (localhost:5173/prooftesting/ptallocation)
-- Tabs: Allocation Table, PT Running Table, Rejected Spool
-- Fields: scan_drawn_spool_barcode, date, preform_id (auto), dt_no (auto),
--         drawn_length (auto), product_type (auto), pt_strain (dropdown),
--         pt_machine (dropdown), allocated_by (dropdown), shift_incharge (dropdown),
--         remark
-- Pending Allocation List: preform_id, draw_spool_id, dt_no, draw_length, pt_done, balance_length
-- Actions: Allocate / Reject

CREATE TABLE pt_allocation (
    pt_allocation_id SERIAL PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    allocation_date DATE DEFAULT CURRENT_DATE,
    preform_id VARCHAR(20),
    tower_id INT,
    drawn_length DECIMAL(10,2),
    product_type VARCHAR(50),
    pt_strain_id INT,
    pt_machine_id INT NOT NULL,
    allocated_by_id INT NOT NULL,
    shift_incharge_id INT NOT NULL,
    allocation_remark TEXT,
    is_reject BOOLEAN DEFAULT FALSE,
    is_pt_complete BOOLEAN DEFAULT FALSE,
    balance_length DECIMAL(10,2),

    -- Logged in user and entry time
    logged_in_user VARCHAR(50) NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pta_spool_id FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id),
    CONSTRAINT fk_pta_preform_id FOREIGN KEY (preform_id) REFERENCES preform_accept(preform_id),
    CONSTRAINT fk_pta_tower_id FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id),
    CONSTRAINT fk_pta_strain FOREIGN KEY (pt_strain_id) REFERENCES master_pt_strain(pt_strain_id),
    CONSTRAINT fk_pta_machine_id FOREIGN KEY (pt_machine_id) REFERENCES pt_machine(pt_machine_id),
    CONSTRAINT fk_pta_allocated_by FOREIGN KEY (allocated_by_id) REFERENCES pt_users(pt_user_id),
    CONSTRAINT fk_pta_shift_incharge FOREIGN KEY (shift_incharge_id) REFERENCES pt_users(pt_user_id),
    CONSTRAINT fk_pta_logged_in_user FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)
);
