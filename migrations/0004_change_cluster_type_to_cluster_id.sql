-- Migration: Change criteria.cluster_type (text) to criteria.cluster_id (foreign key)
-- Date: 2025-01-08

BEGIN;

-- Step 1: Add new column cluster_id
ALTER TABLE criteria 
ADD COLUMN cluster_id VARCHAR;

-- Step 2: Drop old column cluster_type
ALTER TABLE criteria 
DROP COLUMN cluster_type;

-- Step 3: Add foreign key constraint
ALTER TABLE criteria 
ADD CONSTRAINT criteria_cluster_id_fkey 
FOREIGN KEY (cluster_id) 
REFERENCES clusters(id) 
ON DELETE CASCADE;

-- Step 4: Add comment
COMMENT ON COLUMN criteria.cluster_id IS 'Cụm áp dụng (foreign key to clusters), null = áp dụng cho tất cả cụm';

COMMIT;
