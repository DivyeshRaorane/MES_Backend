CREATE TABLE tray_master (
    tray_id SERIAL PRIMARY KEY,
    tray_no INT NOT NULL UNIQUE,
    tray_name VARCHAR(50),
    total_positions INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);