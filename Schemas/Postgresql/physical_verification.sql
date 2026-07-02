CREATE TABLE physical_verification(
    bobbin_no VARCHAR(20) PRIMARY KEY,
    is_onl_verification BOOLEAN DEFAULT false,
    is_re_p_verification BOOLEAN DEFAULT false,
    pv_operator_id INT NOT NULL,
    pv_date DATE DEFAULT CURRENT_DATE,
    pv_time TIME DEFAULT CURRENT_TIME,
    shift_id INT NOT NULL,

    CONSTRAINT fk_bobbin_no_pv_entry FOREIGN KEY (bobbin_no) REFERENCES pt_entry(bobbin_no),
    CONSTRAINT fk_pv_operator_id_pv_entry FOREIGN KEY (pv_operator_id) REFERENCES qc_users(qc_user_id),
    CONSTRAINT fk_shift_id_pv_entry FOREIGN KEY (shift_id) REFERENCES shifts(shift_id)
)