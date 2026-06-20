-- Child table: Analysis Data Logs (multiple rows per pt_break_analysis)
-- Columns: sr_no, spool_id, pt_breaks, break_checked, pt_brks_per_k, bsa_percent

CREATE TABLE pt_break_analysis_log (
    analysis_log_id SERIAL PRIMARY KEY,
    break_analysis_id INT NOT NULL,
    sr_no INT,
    spool_id VARCHAR(50),
    pt_breaks INT DEFAULT 0,
    break_checked INT DEFAULT 0,
    pt_brks_per_k DECIMAL(10,2) DEFAULT 0,
    bsa_percent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (break_analysis_id) REFERENCES pt_break_analysis(break_analysis_id) ON DELETE CASCADE
);
