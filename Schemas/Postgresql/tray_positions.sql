CREATE TABLE tray_position (
    tray_position_id SERIAL PRIMARY KEY,

    tray_id INT NOT NULL REFERENCES tray_master(tray_id),

    position_no INT NOT NULL,

    bobbin_no VARCHAR(50),

    status VARCHAR(20) DEFAULT 'EMPTY'
        CHECK (status IN ('EMPTY','OCCUPIED')),

    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tray_id, position_no),
    UNIQUE(bobbin_no)
);