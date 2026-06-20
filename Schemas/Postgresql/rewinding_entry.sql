-- Screen: REW / COL ENTRY (Rewinding Tab)
-- URL: /prooftesting/rewcoltentry
-- Spool & Identification: spool_id (fetch), colour (auto), colour_batch_code (auto),
--                          rew_reason (dropdown), length, rew_type (dropdown), machine_no (dropdown)
-- FID & Scrap: fid (generated), scrap_length, bobbin_type (dropdown),
--              operator (dropdown), bobbin_colour (dropdown)
-- Table: DFG_id, rewinding, scrap, balance (multiple rows)
-- Remarks: q_remark (auto), remark
-- Length Allocation Details (child): length, fid, barcode/scrap_id, start_pos, end_pos
-- Rewinding Instructions (child): instruction (checkbox), length_km

CREATE TABLE rewinding_entry (
    rewinding_id SERIAL PRIMARY KEY,

    -- Spool & Identification
    spool_id VARCHAR(50) NOT NULL,
    colour_id INT,
    colour_batch_code VARCHAR(50),
    rew_reason_id INT,
    length DECIMAL(10,3),
    rew_type_id INT,
    machine_id INT,

    -- FID & Scrap
    fid VARCHAR(50),
    scrap_length DECIMAL(10,3) DEFAULT 0,
    bobbin_type_id INT,
    operator_id INT,
    bobbin_colour_id INT,

    -- Remarks
    q_remark TEXT,
    remark TEXT,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (colour_id) REFERENCES master_colour(colour_id),
    FOREIGN KEY (rew_reason_id) REFERENCES master_rew_reason(rew_reason_id),
    FOREIGN KEY (rew_type_id) REFERENCES master_rew_type(rew_type_id),
    FOREIGN KEY (machine_id) REFERENCES master_pt_machine(machine_id),
    FOREIGN KEY (bobbin_type_id) REFERENCES master_bobbin_type(bobbin_type_id),
    FOREIGN KEY (operator_id) REFERENCES master_operator(operator_id),
    FOREIGN KEY (bobbin_colour_id) REFERENCES master_bobbin_color(bobbin_color_id),
    FOREIGN KEY (logged_in_user) REFERENCES user_table(user_id)
);
