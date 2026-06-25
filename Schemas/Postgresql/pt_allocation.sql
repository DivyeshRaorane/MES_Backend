CREATE TABLE pt_allocation(
    pt_allocation_id SERIAL PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    allocation_date DATE DEFAULT CURRENT_DATE,
    preform_id VARCHAR(20) NOT NULL,
    tower_id INT NOT NULL,
    drawn_length DECIMAL(10,2) NOT NULL,
    product_type VARCHAR(20),
    pt_strain INT NOT NULL,
    pt_machine_id INT NOT NULL,
    allocated_by_id INT NOT NULL,
    shift_incharge_id INT NOT NULL,
    allocation_remark TEXT,
    is_reject BOOLEAN DEFAULT false,
    is_pt_complete BOOLEAN DEFAULT false,

    logged_in_user INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP , 

    CONSTRAINT fk_pta_spool_id FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id),
    CONSTRAINT fk_pta_preform_id FOREIGN KEY (preform_id) REFERENCES preform_accept(preform_id),
    CONSTRAINT fk_pta_tower_id FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id),
    CONSTRAINT fk_pta_machine_id FOREIGN KEY (pt_machine_id) REFERENCES pt_machine(pt_machine_id),
    CONSTRAINT fk_pta_allocated_by FOREIGN KEY (allocated_by_id) REFERENCES pt_users(pt_user_id),
    CONSTRAINT fk_pta_shift_incharge FOREIGN KEY (shift_incharge_id) REFERENCES pt_users(pt_user_id),
    CONSTRAINT fk_pta_logged_in_user FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)

)