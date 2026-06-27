CREATE TABLE pt_rejection(
    pt_rejection_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(20) NOT NULL,

    rejection BOOLEAN DEFAULT FALSE,
    rejection_reason VARCHAR(50),

    bal_draw_rejection BOOLEAN DEFAULT FALSE,
    bal_draw_rejection_reason VARCHAR(50),

    multiple_end BOOLEAN DEFAULT FALSE,
    multiple_end_length DECIMAL(10,2),

    scratch BOOLEAN DEFAULT FALSE,
    scratch_length DECIMAL(10,2),

    pt_scrap BOOLEAN DEFAULT FALSE,
    pt_scrap_length DECIMAL(10,2),

    ztmd BOOLEAN DEFAULT FALSE,
    ztmd_id VARCHAR(50),

    doc BOOLEAN DEFAULT FALSE,
    doc_id VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bobbin_no_pt_rejection FOREIGN KEY (bobbin_no) REFERENCES pt_entry(bobbin_no)
);