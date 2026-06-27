CREATE TABLE pt_entry(
    bobbin_no VARCHAR(20) PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    pt_date Date NOT NULL DEFAULT CURRENT_DATE,
    fid VARCHAR(20) UNIQUE,
    pt_machine_id SERIAL,
    operator_id SERIAL,
    shift_incharge_id SERIAL,
    bobbin_color_id INT NOT NULL,
    bobbin_type_id INT NOT NULL,
    running_strain INT NOT NULL,
    product_type_id INT,
    pt_done_length DECIMAL(10,2) NOT NULL,
    payoff_vibration VARCHAR(20),
    dancer_vibration VARCHAR(20),
    balance_length DECIMAL(10,2) NOT NULL,

    logged_in_user INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP , 


    CONSTRAINT fk_spool_id_pt_entry FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id)
    CONSTRAINT fk_pt_machine_id_pt_entry FOREIGN KEY (pt_machine_id) REFERENCES pt_machine(pt_machine_id)
    CONSTRAINT fk_operator_id_pt_entry FOREIGN KEY (operator_id) REFERENCES pt_users(pt_user_id)
    CONSTRAINT fk_shift_incharge_id_pt_entry FOREIGN KEY (shift_incharge_id) pt_users(pt_user_id)
    CONSTRAINT fk_bobbin_color_id_pt_entry FOREIGN KEY (bobbin_color_id) bobbin_color(bobbin_color_id)
    CONSTRAINT fk_bobbin_type_id_pt_entry FOREIGN KEY (bobbin_type_id)  bobbin_type(bobbin_type_id)


    
);