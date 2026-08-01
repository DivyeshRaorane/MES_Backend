-- ============================================================
-- MIGRATION: Dynamic Report Visibility by Section
-- Run this script in order on your PostgreSQL database
-- ============================================================

-- 1. Create report_section_master
CREATE TABLE IF NOT EXISTS report_section_master (
    section_id SERIAL PRIMARY KEY,
    section_key VARCHAR(50) UNIQUE NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    disable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed data
INSERT INTO report_section_master (section_key, section_name, display_order) VALUES
('DRAW_MANAGEMENT', 'Draw Management', 1),
('PROOF_TESTING', 'Proof Testing', 2),
('QUALITY', 'Quality', 3),
('QUALITY_ASSURANCE', 'Quality Assurance', 4),
('FINISH_GOODS', 'Finish Goods', 5),
('DISPATCH', 'Dispatch', 6),
('DYNAMIC_REPORTS', 'Dynamic Reports', 7)
ON CONFLICT (section_key) DO NOTHING;

-- 3. Create report_section_mapping
CREATE TABLE IF NOT EXISTS report_section_mapping (
    mapping_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES report_master(id) ON DELETE CASCADE,
    section_id INTEGER NOT NULL REFERENCES report_section_master(section_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_report_section_mapping_section 
    ON report_section_mapping(section_id);

CREATE INDEX IF NOT EXISTS idx_report_section_mapping_report 
    ON report_section_mapping(report_id);

-- 4. Migrate existing reports to DYNAMIC_REPORTS section
INSERT INTO report_section_mapping (report_id, section_id)
SELECT rm.id, rsm.section_id
FROM report_master rm
CROSS JOIN report_section_master rsm
WHERE rsm.section_key = 'DYNAMIC_REPORTS'
  AND rm.is_deleted = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM report_section_mapping m 
      WHERE m.report_id = rm.id AND m.section_id = rsm.section_id
  );

-- Done! All existing reports now mapped to Dynamic Reports section.
