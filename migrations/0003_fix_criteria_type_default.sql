-- Migration: Fix criteria_type default value
-- Date: 2025-11-16
-- Description: Change criteria_type default from 1 to 0 (parent nodes should default to 0)

BEGIN;

-- Update default value for criteria_type
ALTER TABLE criteria 
  ALTER COLUMN criteria_type SET DEFAULT 0;

-- Update existing parent nodes (those with children) to criteriaType = 0
UPDATE criteria 
SET criteria_type = 0
WHERE id IN (
  SELECT DISTINCT parent_id 
  FROM criteria 
  WHERE parent_id IS NOT NULL
);

-- Add comment for clarity
COMMENT ON COLUMN criteria.criteria_type IS '0=tiêu chí cha (không chấm điểm), 1=định lượng, 2=định tính, 3=chấm thẳng, 4=cộng/trừ';
COMMENT ON COLUMN criteria.year IS 'Năm áp dụng tiêu chí';
COMMENT ON COLUMN criteria.cluster_type IS 'Loại cụm áp dụng: phong, xa_phuong, khac, hoặc NULL (áp dụng tất cả)';

COMMIT;
