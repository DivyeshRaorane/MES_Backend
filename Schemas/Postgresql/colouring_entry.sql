-- Screen: COLOURING ENTRY (localhost:5173/prooftesting/rewcoltentry - Colouring tab)
-- Same layout as Rewinding but for colouring process
-- Spool & Identification: spool_id (fetch), colour (auto), colour_batch_code (auto),
--                          rew_reason (dropdown), length, rew_type (dropdown), machine_no (dropdown)
-- FID & Scrap: fid (generate), scrap_length, bobbin_type (dropdown),
--              operator (dropdown), bobbin_colour (dropdown)
-- FID Grid: fid, rewinding, scrap, balance (multiple rows)
-- Remarks: q_remark (auto-fetch), remark (manual)
-- Length Allocation Details: length, fid, barcode/scrap_id, start_pos, end_pos (multiple rows)
-- Rewinding Instructions: checkbox list with instruction + length(km)

CREATE TABLE colouring_entry (
    colouring_id SERIAL PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    colour VARCHAR(30),
    colour_batch_code VARCHAR(50),
    rew_reason_id INT,
    length DECIMAL(10,3),
    rew_type_id INT,
    machine_no_id INT,

    -- FID & Scrap
    fid VARCHAR(30),
    scrap_length DECIMAL(10,3) DEFAULT 0,
    bobbin_type_id INT,
    operator_id INT,
    bobbin_colour_id INT,

    -- Remarks
    q_remark TEXT,
    remark TEXT,

    -- Logged in user and entry time
    logged_in_user VARCHAR(50) NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_col_spool FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id),
    CONSTRAINT fk_col_reason FOREIGN KEY (rew_reason_id) REFERENCES master_rew_reason(rew_reason_id),
    CONSTRAINT fk_col_type FOREIGN KEY (rew_type_id) REFERENCES master_rew_type(rew_type_id),
    CONSTRAINT fk_col_machine FOREIGN KEY (machine_no_id) REFERENCES pt_machine(pt_machine_id),
    CONSTRAINT fk_col_bobbin_type FOREIGN KEY (bobbin_type_id) REFERENCES bobbin_type(bobbin_type_id),
    CONSTRAINT fk_col_operator FOREIGN KEY (operator_id) REFERENCES master_rew_operator(rew_operator_id),
    CONSTRAINT fk_col_bobbin_colour FOREIGN KEY (bobbin_colour_id) REFERENCES bobbin_color(bobbin_color_id),
    CONSTRAINT fk_col_logged_in_user FOREIGN KEY (logged_in_user) REFERENCES users(emp_id)
);
