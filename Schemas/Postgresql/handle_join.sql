-- Screen 2: HANDLE JOINING
-- Fields: preform_id, dia1-5 (measurement logs), handle_length, handle_diameter,
--         cone_length, handle_number, flame recipe parameters (multiple rows),
--         additional_notes
-- Joined By user (dropdown) + Logged in user + entry timestamp

CREATE TABLE handle_join (
    handle_join_id SERIAL PRIMARY KEY,
    preform_id VARCHAR(20) NOT NULL,

    -- Measurement Logs
    dia1 DECIMAL(10,2),
    dia2 DECIMAL(10,2),
    dia3 DECIMAL(10,2),
    dia4 DECIMAL(10,2),
    dia5 DECIMAL(10,2),

    h2flow1 DECIMAL(10,2),
    h2flow2 DECIMAL(10,2),
    h2flow3 DECIMAL(10,2),
    o2line1_flow1 DECIMAL(10,2),
    o2line1_flow2 DECIMAL(10,2),
    o2line1_flow3 DECIMAL(10,2),

    h2flow1_time DECIMAL(10,2),
    h2flow2_time DECIMAL(10,2),
    h2flow3_time DECIMAL(10,2),
    o2line1_flow1_time DECIMAL(10,2),
    o2line1_flow2_time DECIMAL(10,2),
    o2line1_flow3_time DECIMAL(10,2),

    h2flow1_cons DECIMAL(10,2),
    h2flow2_cons DECIMAL(10,2),
    h2flow3_cons DECIMAL(10,2),
    o2line1_flow1_cons DECIMAL(10,2),
    o2line1_flow2_cons DECIMAL(10,2),
    o2line1_flow3_cons DECIMAL(10,2),

    -- Handle details
    handle_length DECIMAL(10,2),
    handle_diameter DECIMAL(10,2),
    cone_length DECIMAL(10,2),
    handle_number INT,

    -- Joined by (dropdown master)
    joined_by INT NOT NULL,
    

    -- Additional notes
    additional_notes TEXT,

   is_handle_join BOOLEAN NOT NULL DEFAULT TRUE,
   is_allocate BOOLEAN NOT NULL DEFAULT FALSE,

   disconnect_remark TEXT,
   disconnected_at TIMESTAMP,
   disconnected_by INT,

    -- Logged in user and entry time
    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (preform_id) REFERENCES preform_accept(preform_id)
    
);
