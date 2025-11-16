-- Migration: Add periodId to criteria table
-- This links criteria directly to evaluation periods

-- Add periodId column (nullable first to allow existing data)
ALTER TABLE "criteria" 
ADD COLUMN "period_id" varchar;

-- Add foreign key constraint
ALTER TABLE "criteria" 
ADD CONSTRAINT "criteria_period_id_evaluation_periods_id_fk" 
FOREIGN KEY ("period_id") 
REFERENCES "evaluation_periods"("id") 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX "criteria_period_id_idx" ON "criteria"("period_id");

-- Note: Keep year and clusterId for backward compatibility and flexible queries
-- year: Can filter criteria by year without needing a period
-- clusterId: Each cluster has its own set of criteria
-- periodId: Links criteria to specific evaluation period (optional, for period-specific criteria)
