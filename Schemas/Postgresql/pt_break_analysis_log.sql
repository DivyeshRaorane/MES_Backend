-- Analysis Data Logs (child table of pt_break_analysis)
-- Auto-generated tracking of break analysis per spool

CREATE TABLE pt_break_analysis_log (
    analysis_log_id SERIAL PRIMARY KEY,
    break_analysis_id INT NOT NULL,
    sr_no INT,
    spool_id VARCHAR(20),
    pt_breaks INT DEFAULT 0,
    break_checked INT DEFAULT 0,
    pt_brks_per_k DECIMAL(10,2) DEFAULT 0,
    bsa_percent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ptbal_analysis FOREIGN KEY (break_analysis_id) REFERENCES pt_break_analysis(break_analysis_id) ON DELETE CASCADE
);
