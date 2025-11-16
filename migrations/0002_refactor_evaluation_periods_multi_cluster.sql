-- Migration: Refactor evaluation_periods to support multiple clusters
-- 1 kỳ thi đua → nhiều cụm → nhiều đơn vị

BEGIN;

-- Step 1: Backup old cluster_id from evaluation_periods before dropping
CREATE TEMP TABLE temp_period_clusters AS
SELECT id as period_id, cluster_id, created_at
FROM evaluation_periods
WHERE cluster_id IS NOT NULL;

-- Step 2: Drop cluster_id from evaluation_periods
ALTER TABLE evaluation_periods DROP COLUMN IF EXISTS cluster_id;

-- Step 3: Create new junction table evaluation_period_clusters
CREATE TABLE IF NOT EXISTS evaluation_period_clusters (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  period_id VARCHAR NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  cluster_id VARCHAR NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT uniq_period_cluster UNIQUE (period_id, cluster_id)
);

-- Step 4: Migrate old data to new table
INSERT INTO evaluation_period_clusters (period_id, cluster_id, created_at)
SELECT period_id, cluster_id, created_at
FROM temp_period_clusters
ON CONFLICT (period_id, cluster_id) DO NOTHING;

-- Step 5: Add cluster_id to evaluations table
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS cluster_id VARCHAR;

-- Step 6: Auto-fill cluster_id in evaluations from units table
UPDATE evaluations e
SET cluster_id = u.cluster_id
FROM units u
WHERE e.unit_id = u.id
AND e.cluster_id IS NULL;

-- Step 7: Make cluster_id NOT NULL after filling data
ALTER TABLE evaluations ALTER COLUMN cluster_id SET NOT NULL;

-- Step 8: Add foreign key constraint
ALTER TABLE evaluations 
ADD CONSTRAINT fk_evaluations_cluster 
FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE;

-- Drop temp table
DROP TABLE temp_period_clusters;

COMMIT;
