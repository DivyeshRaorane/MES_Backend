-- Screen: PT ENTRY
-- URL: /prooftesting/ptentry
-- Spool Info: drawn_spool_id (scan), preform_id (auto), drawn_length (auto),
--             dt_no (auto), pt_in_entry_date, fid, pt_bobbin_no (scan), barcode (scan),
--             spool_status, drawn_remark, pt_id (generated)
-- Personnel & Metrics: pt_machine_no (dropdown), operator_name (dropdown),
--                      shift_incharge (dropdown), bobbin_color (dropdown),
--                      bobbin_type (dropdown), running_strain (dropdown),
--                      product_type (auto), pt_done (km), be_scrap,
--                      payoff_vibration (dropdown), dancer_vibration (dropdown),
--                      balance (km)
-- Rejections: checkboxes (rejection, bal_draw_rej, multiple_end, scratch,
--             pt_scrap, ztmd, doc)
-- Draw Flaw Log: multiple rows (draw_flaw, pos1, pos2, defect_len, act_cut_len)
-- PT Process Log: multiple rows (barcode/id/flaw, length, reason)

CREATE TABLE pt_entry (
    pt_entry_id SERIAL PRIMARY KEY,

    -- Spool Info
    drawn_spool_id VARCHAR(50) NOT NULL,
    preform_id VARCHAR(20),
    drawn_length DECIMAL(10,2),
    tower_id INT,
    pt_in_entry_date DATE NOT NULL,
    fid VARCHAR(50),
    pt_bobbin_no VARCHAR(50),
    barcode VARCHAR(50),
    spool_status VARCHAR(50),
    drawn_remark TEXT,
    pt_id VARCHAR(50),
    bobbin_status_ok BOOLEAN DEFAULT FALSE,

    -- Personnel & Metrics
    pt_machine_id INT NOT NULL,
    operator_id INT NOT NULL,
    shift_incharge_id INT NOT NULL,
    bobbin_color_id INT,
    bobbin_type_id INT,
    running_strain_id INT,
    product_type_id INT,
    pt_done_km DECIMAL(10,3) DEFAULT 0,
    be_scrap DECIMAL(10,3) DEFAULT 0,
    payoff_vibration_id INT,
    dancer_vibration_id INT,
    balance_km DECIMAL(10,3),
    drawn_date DATE,

    -- Rejections (checkboxes)
    rejection BOOLEAN DEFAULT FALSE,
    bal_draw_rej BOOLEAN DEFAULT FALSE,
    multiple_end BOOLEAN DEFAULT FALSE,
    scratch BOOLEAN DEFAULT FALSE,
    pt_scrap BOOLEAN DEFAULT FALSE,
    ztmd BOOLEAN DEFAULT FALSE,
    doc BOOLEAN DEFAULT FALSE,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (preform_id) REFERENCES preform_data(preform_id),
    FOREIGN KEY (tower_id) REFERENCES draw_tower(tower_id),
    FOREIGN KEY (pt_machine_id) REFERENCES master_pt_machine(machine_id),
    FOREIGN KEY (operator_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (shift_incharge_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (bobbin_color_id) REFERENCES master_bobbin_color(bobbin_color_id),
    FOREIGN KEY (bobbin_type_id) REFERENCES master_bobbin_type(bobbin_type_id),
    FOREIGN KEY (running_strain_id) REFERENCES master_running_strain(running_strain_id),
    FOREIGN KEY (product_type_id) REFERENCES master_product_type(product_type_id),
    FOREIGN KEY (payoff_vibration_id) REFERENCES master_payoff_vibration(payoff_vibration_id),
    FOREIGN KEY (dancer_vibration_id) REFERENCES master_dancer_vibration(vibration_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
);
