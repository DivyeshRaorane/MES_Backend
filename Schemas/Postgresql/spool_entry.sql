-- Screen 4: DRAW SPOOL ENTRY
-- Initial Parameters + Operator Details + Draw Parameters + Draw Flaws + Consumption Details
-- Logged in user + entry timestamp


CREATE TABLE spool_entry(
    spool_id VARCHAR(20) PRIMARY KEY,
    preform_id VARCHAR(20) NOT NULL,
    drawn_weight DECIMAL(10,2) NOT NULL,
    drawn_length DECIMAL(10,2) NOT NULL,
    balance_weight DECIMAL(10,2) NOT NULL,
    shift TEXT NOT NULL,
    start_date Date DEFAULT CURRENT_DATE,
    start_time TIME DEFAULT CURRENT_TIME,
    end_date Date DEFAULT CURRENT_DATE,
    end_time TIME DEFAULT CURRENT_TIME,
    entry_date TIMESTAMP CURRENT_TIMESTAMP,
    spool_no INT NOT NULL,

)