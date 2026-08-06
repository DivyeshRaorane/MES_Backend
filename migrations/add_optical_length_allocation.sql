-- Migration: Add Optical Length Based Allocation columns to spec_master
-- Date: 2026-08-05

ALTER TABLE spec_master
ADD COLUMN IF NOT EXISTS allocation_ratio NUMERIC(3,1) CHECK (allocation_ratio IN (2.1, 4.2)),
ADD COLUMN IF NOT EXISTS minimum_length NUMERIC(5,1);

-- allocation_ratio: Allowed values are 2.1 or 4.2 (enforced by CHECK constraint)
-- minimum_length: Must be a multiple of allocation_ratio, up to 50.4
-- If allocation_ratio is NULL, minimum_length must also be NULL (enforced in application layer)
