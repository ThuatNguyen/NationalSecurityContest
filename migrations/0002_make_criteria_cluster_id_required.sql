-- Migration: Make cluster_id required in criteria table
-- Mỗi cụm thi đua phải có BỘ TIÊU CHÍ RIÊNG

-- Step 1: Update existing NULL cluster_id (if any) to a default cluster
-- IMPORTANT: Replace 'default-cluster-id' with actual cluster ID from your database
-- You can get it by running: SELECT id FROM clusters LIMIT 1;
-- UPDATE criteria SET cluster_id = 'default-cluster-id' WHERE cluster_id IS NULL;

-- Step 2: Make cluster_id NOT NULL
ALTER TABLE criteria ALTER COLUMN cluster_id SET NOT NULL;
