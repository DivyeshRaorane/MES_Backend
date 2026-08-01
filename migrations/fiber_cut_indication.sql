-- Migration: Create fiber_cut_indication table and link to d_fiber_cut_reasons
-- Date: 2026-08-01

-- 1. Create the fiber_cut_indication table
CREATE TABLE IF NOT EXISTS fiber_cut_indication (
    indication_fiber_cut_id SERIAL PRIMARY KEY,
    indication_name VARCHAR(100) NOT NULL UNIQUE,
    disable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed with existing hardcoded values for backward compatibility
INSERT INTO fiber_cut_indication (indication_name) VALUES
('Cut'), ('Sample'), ('Break'), ('Trial')
ON CONFLICT (indication_name) DO NOTHING;

-- 3. Add foreign key column to d_fiber_cut_reasons
ALTER TABLE d_fiber_cut_reasons
ADD COLUMN IF NOT EXISTS indication_fiber_cut_id INTEGER REFERENCES fiber_cut_indication(indication_fiber_cut_id);

-- 4. Update existing reasons to link to 'Cut' indication (ID 1) where not already set
UPDATE d_fiber_cut_reasons SET indication_fiber_cut_id = 1 WHERE indication_fiber_cut_id IS NULL;
