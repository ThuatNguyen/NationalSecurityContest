-- Migration: Update clusters and units tables with new schema
-- Date: 2025-11-15
-- Description: 
--   - Add short_name and cluster_type to clusters
--   - Add short_name to units
--   - Add updated_at to both tables
--   - Add unique constraints
--   - Change onDelete behavior for units.cluster_id from CASCADE to RESTRICT

-- ============================================
-- PART 1: ALTER CLUSTERS TABLE
-- ============================================

-- Add new columns to clusters table
ALTER TABLE clusters 
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS cluster_type TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Set default values for existing rows (adjust these as needed for your data)
UPDATE clusters 
SET 
  short_name = COALESCE(short_name, UPPER(SUBSTRING(name FROM 1 FOR 3))),
  cluster_type = COALESCE(cluster_type, 'khac'),
  updated_at = COALESCE(updated_at, created_at);

-- Make columns NOT NULL after setting defaults
ALTER TABLE clusters 
  ALTER COLUMN short_name SET NOT NULL,
  ALTER COLUMN cluster_type SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- Add unique constraints
ALTER TABLE clusters ADD CONSTRAINT clusters_name_unique UNIQUE (name);
ALTER TABLE clusters ADD CONSTRAINT clusters_short_name_unique UNIQUE (short_name);

-- Add check constraint for cluster_type
ALTER TABLE clusters 
  ADD CONSTRAINT clusters_cluster_type_check 
  CHECK (cluster_type IN ('phong', 'xa_phuong', 'khac'));

-- Create index on cluster_type for filtering
CREATE INDEX IF NOT EXISTS idx_clusters_cluster_type ON clusters(cluster_type);

-- ============================================
-- PART 2: ALTER UNITS TABLE
-- ============================================

-- Add new columns to units table
ALTER TABLE units 
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Set default values for existing rows
UPDATE units 
SET 
  short_name = COALESCE(short_name, UPPER(SUBSTRING(name FROM 1 FOR 3))),
  updated_at = COALESCE(updated_at, created_at);

-- Make columns NOT NULL after setting defaults
ALTER TABLE units 
  ALTER COLUMN short_name SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- Add unique constraints
ALTER TABLE units ADD CONSTRAINT units_name_unique UNIQUE (name);
ALTER TABLE units ADD CONSTRAINT units_short_name_unique UNIQUE (short_name);

-- Create index on cluster_id for better foreign key performance
CREATE INDEX IF NOT EXISTS idx_units_cluster_id ON units(cluster_id);

-- ============================================
-- PART 3: UPDATE FOREIGN KEY CONSTRAINTS
-- ============================================

-- Note: To change onDelete from CASCADE to RESTRICT, we need to:
-- 1. Drop the existing foreign key constraint
-- 2. Recreate it with the new behavior

-- First, find the constraint name (it may vary)
-- You can run this query to find it:
-- SELECT con.conname FROM pg_constraint con
-- INNER JOIN pg_class rel ON rel.oid = con.conrelid
-- WHERE rel.relname = 'units' AND con.contype = 'f' AND con.confrelid = 'clusters'::regclass;

-- Drop and recreate the foreign key constraint
-- Note: The constraint name may differ based on your Drizzle ORM version
-- Adjust the constraint name accordingly if needed

DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'units' 
      AND con.contype = 'f' 
      AND con.confrelid = 'clusters'::regclass;
    
    IF constraint_name IS NOT NULL THEN
        -- Drop the old constraint
        EXECUTE format('ALTER TABLE units DROP CONSTRAINT IF EXISTS %I', constraint_name);
        
        -- Add the new constraint with RESTRICT
        ALTER TABLE units 
          ADD CONSTRAINT units_cluster_id_fkey 
          FOREIGN KEY (cluster_id) 
          REFERENCES clusters(id) 
          ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================
-- PART 4: COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN clusters.short_name IS 'Tên viết tắt của cụm thi đua';
COMMENT ON COLUMN clusters.cluster_type IS 'Loại cụm: phong (Cụm cấp phòng), xa_phuong (Cụm Công an xã/phường/đặc khu), khac (các cụm khác)';
COMMENT ON COLUMN units.short_name IS 'Tên viết tắt của đơn vị';

-- ============================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ============================================

-- Uncomment these to verify the migration:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'clusters' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'units' ORDER BY ordinal_position;
-- SELECT * FROM pg_constraint WHERE conrelid = 'units'::regclass AND contype = 'f';
