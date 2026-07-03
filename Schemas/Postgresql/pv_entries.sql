CREATE TABLE pv_entries (
  pv_entry_id       SERIAL PRIMARY KEY,
  pv_type           VARCHAR(50) NOT NULL,          -- 'online' or 're_pv'
  pv_operator       VARCHAR(100) NOT NULL,
  shift             VARCHAR(10) NOT NULL,
  pv_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  pv_time           TIME NOT NULL DEFAULT CURRENT_TIME,
  pv_remark         TEXT,
  
  -- Bobbin info (from bobbin_entries lookup)
  bobbin_id         VARCHAR(100) NOT NULL,         -- scanned barcode
  bobbin_fid        VARCHAR(50) NOT NULL,
  spool_fid         VARCHAR(50) NOT NULL,
  spool_id          VARCHAR(100),                  -- from bobbin_entries
  preform_id        VARCHAR(100),                  -- from bobbin_entries
  fiber_type        VARCHAR(50),                   -- from bobbin_entries
  colour            VARCHAR(50),                   -- from bobbin_entries (if applied)
  qty_kms           DECIMAL(10,3),                 -- from bobbin_entries
  
  
  -- Metadata
  logged_in_user    VARCHAR(100),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
