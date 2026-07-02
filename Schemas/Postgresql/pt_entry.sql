-- Screen: PT ENTRY (localhost:5173/prooftesting/ptentry)
-- Spool Info: drawn_spool_id (scan), preform_id (auto), drawn_length (auto),
--             dt_no (auto), drawn_date, pt_in_entry_date, fid, pt_bobbin_no (scan),
--             barcode (scan), spool_status, drawn_remark (auto-fetch), bobbin_status_ok (checkbox),
--             pt_id (generated)
-- Personnel & Metrics: pt_machine_no (dropdown), operator_name (dropdown),
--                      shift_incharge (dropdown), bobbin_color (dropdown),
--                      bobbin_type (dropdown), running_strain (dropdown),
--                      product_type, pt_done (km), be_scrap, payoff_vibration (dropdown),
--                      dancer_vibration (dropdown), balance (km)
-- Rejections: rejection, bal_draw_rej, multiple_end, scratch, pt_scrap, ztmd, doc (checkboxes)
-- Draw Flaw Log: draw_flaw, pos1, pos2, defect_len, act_cut_len (multiple rows)
-- PT Process Log: barcode/id/flaw, length, reason (multiple rows)

CREATE TABLE pt_entry (
    pt_entry_id SERIAL PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    preform_id VARCHAR(20),
    drawn_length DECIMAL(10,2),
    dt_no INT,
    drawn_date DATE,
    pt_in_entry_date DATE DEFAULT CURRENT_DATE,
    fid VARCHAR(30),
    pt_bobbin_no VARCHAR(30),
    barcode VARCHAR(50),
    spool_status VARCHAR(30),
    drawn_remark TEXT,
    bobbin_status_ok BOOLEAN DEFAULT FALSE,
    pt_id VARCHAR(30),

    -- Personnel & Metrics
    pt_machine_id INT,
    operator_id INT,
    shift_incharge_id INT,
    bobbin_color_id INT,
    bobbin_type_id INT,
    running_strain_id INT,
    product_type VARCHAR(50),
    pt_done DECIMAL(10,3) DEFAULT 0,
    be_scrap DECIMAL(10,2) DEFAULT 0,
    payoff_vibration VARCHAR(20) DEFAULT 'Normal',
    dancer_vibration VARCHAR(20) DEFAULT 'Normal',
    balance_km DECIMAL(10,3),

    -- Rejections (checkboxes)
    rejection BOOLEAN DEFAULT FALSE,
    bal_draw_rejection BOOLEAN DEFAULT FALSE,
    multiple_end BOOLEAN DEFAULT FALSE,
    scratch BOOLEAN DEFAULT FALSE,
    pt_scrap BOOLEAN DEFAULT FALSE,
    ztmd BOOLEAN DEFAULT FALSE,
    doc BOOLEAN DEFAULT FALSE,

    -- Logged in user and entry time
    logged_in_user VARCHAR(50) NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pte_spool_id FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id),
    CONSTRAINT fk_pte_machine FOREIGN KEY (pt_machine_id) REFERENCES pt_machine(pt_machine_id),
    CONSTRAINT fk_pte_operator FOREIGN KEY (operator_id) REFERENCES pt_users(pt_user_id),
    CONSTRAINT fk_pte_shift_incharge FOREIGN KEY (shift_incharge_id) REFERENCES pt_users(pt_user_id),
    CONSTRAINT fk_pte_bobbin_color FOREIGN KEY (bobbin_color_id) REFERENCES bobbin_color(bobbin_color_id),
    CONSTRAINT fk_pte_bobbin_type FOREIGN KEY (bobbin_type_id) REFERENCES bobbin_type(bobbin_type_id),
    CONSTRAINT fk_pte_running_strain FOREIGN KEY (running_strain_id) REFERENCES master_pt_strain(pt_strain_id),
    CONSTRAINT fk_pte_logged_in_user FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)
);
