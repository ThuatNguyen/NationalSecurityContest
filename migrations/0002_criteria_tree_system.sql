-- Migration: Criteria Tree System (n-level hierarchy)
-- Date: 2025-11-16
-- Description: Transform criteria from flat structure to n-level tree with multiple scoring types

BEGIN;

-- ============================================
-- STEP 1: Backup existing criteria_groups and criteria data
-- ============================================
CREATE TABLE IF NOT EXISTS criteria_groups_backup AS SELECT * FROM criteria_groups;
CREATE TABLE IF NOT EXISTS criteria_backup AS SELECT * FROM criteria;

-- ============================================
-- STEP 2: Drop old criteria and criteria_groups tables
-- ============================================
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS criteria_groups CASCADE;

-- ============================================
-- STEP 3: Create new criteria table (tree structure)
-- ============================================
CREATE TABLE criteria (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id VARCHAR REFERENCES criteria(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    max_score NUMERIC(7,2) NOT NULL DEFAULT 0,
    
    criteria_type INTEGER NOT NULL DEFAULT 1, -- 1=định lượng, 2=định tính, 3=chấm thẳng, 4=+/-
    formula_type INTEGER, -- 1=không đạt, 2=đạt đủ, 3=dẫn đầu, 4=vượt không dẫn đầu
    
    order_index INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    cluster_type TEXT,
    
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_criteria_parent_id ON criteria(parent_id);
CREATE INDEX idx_criteria_year ON criteria(year);
CREATE INDEX idx_criteria_cluster_type ON criteria(cluster_type);
CREATE INDEX idx_criteria_level ON criteria(level);

-- ============================================
-- STEP 4: Create criteria_formula table
-- ============================================
CREATE TABLE criteria_formula (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id VARCHAR NOT NULL UNIQUE REFERENCES criteria(id) ON DELETE CASCADE,
    target_required INTEGER NOT NULL DEFAULT 1,
    default_target NUMERIC(10,2),
    unit TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_criteria_formula_criteria_id ON criteria_formula(criteria_id);

-- ============================================
-- STEP 5: Create criteria_fixed_score table
-- ============================================
CREATE TABLE criteria_fixed_score (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id VARCHAR NOT NULL UNIQUE REFERENCES criteria(id) ON DELETE CASCADE,
    point_per_unit NUMERIC(7,2) NOT NULL,
    max_score_limit NUMERIC(7,2),
    unit TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_criteria_fixed_score_criteria_id ON criteria_fixed_score(criteria_id);

-- ============================================
-- STEP 6: Create criteria_bonus_penalty table
-- ============================================
CREATE TABLE criteria_bonus_penalty (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id VARCHAR NOT NULL UNIQUE REFERENCES criteria(id) ON DELETE CASCADE,
    bonus_point NUMERIC(7,2),
    penalty_point NUMERIC(7,2),
    min_score NUMERIC(7,2),
    max_score NUMERIC(7,2),
    unit TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_criteria_bonus_penalty_criteria_id ON criteria_bonus_penalty(criteria_id);

-- ============================================
-- STEP 7: Create criteria_targets table
-- ============================================
CREATE TABLE criteria_targets (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id VARCHAR NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    unit_id VARCHAR NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    target_value NUMERIC(10,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(criteria_id, unit_id, year)
);

CREATE INDEX idx_criteria_targets_criteria_id ON criteria_targets(criteria_id);
CREATE INDEX idx_criteria_targets_unit_id ON criteria_targets(unit_id);
CREATE INDEX idx_criteria_targets_year ON criteria_targets(year);

-- ============================================
-- STEP 8: Create criteria_results table
-- ============================================
CREATE TABLE criteria_results (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id VARCHAR NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    unit_id VARCHAR NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    period_id VARCHAR REFERENCES evaluation_periods(id) ON DELETE CASCADE,
    
    -- Input data
    actual_value NUMERIC(10,2),
    self_score NUMERIC(7,2),
    bonus_count INTEGER DEFAULT 0,
    penalty_count INTEGER DEFAULT 0,
    
    -- Calculated scores
    calculated_score NUMERIC(7,2),
    cluster_score NUMERIC(7,2),
    final_score NUMERIC(7,2),
    
    note TEXT,
    evidence_file TEXT,
    
    status TEXT NOT NULL DEFAULT 'draft',
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(criteria_id, unit_id, year)
);

CREATE INDEX idx_criteria_results_criteria_id ON criteria_results(criteria_id);
CREATE INDEX idx_criteria_results_unit_id ON criteria_results(unit_id);
CREATE INDEX idx_criteria_results_year ON criteria_results(year);
CREATE INDEX idx_criteria_results_period_id ON criteria_results(period_id);
CREATE INDEX idx_criteria_results_status ON criteria_results(status);

-- ============================================
-- STEP 9: Recreate scores table (for backward compatibility)
-- ============================================
CREATE TABLE scores (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id VARCHAR NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    criteria_id VARCHAR NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    
    self_score NUMERIC(5,2),
    self_score_file TEXT,
    self_score_date TIMESTAMP,
    
    review1_score NUMERIC(5,2),
    review1_comment TEXT,
    review1_file TEXT,
    review1_date TIMESTAMP,
    review1_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    
    explanation TEXT,
    explanation_file TEXT,
    explanation_date TIMESTAMP,
    
    review2_score NUMERIC(5,2),
    review2_comment TEXT,
    review2_file TEXT,
    review2_date TIMESTAMP,
    review2_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    
    final_score NUMERIC(5,2),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(evaluation_id, criteria_id)
);

CREATE INDEX idx_scores_evaluation_id ON scores(evaluation_id);
CREATE INDEX idx_scores_criteria_id ON scores(criteria_id);

-- ============================================
-- STEP 10: Add comments for documentation
-- ============================================
COMMENT ON TABLE criteria IS 'Tiêu chí thi đua dạng cây n cấp - hỗ trợ parent-child hierarchy không giới hạn cấp';
COMMENT ON COLUMN criteria.criteria_type IS '1=định lượng (có công thức), 2=định tính (đạt/không đạt), 3=chấm thẳng (điểm/lần), 4=+/- (cộng/trừ)';
COMMENT ON COLUMN criteria.formula_type IS 'Cho criteria_type=1: 1=không đạt chỉ tiêu, 2=đạt đủ, 3=dẫn đầu cụm, 4=vượt không dẫn đầu';
COMMENT ON TABLE criteria_formula IS 'Chi tiết công thức cho tiêu chí định lượng';
COMMENT ON TABLE criteria_fixed_score IS 'Chi tiết cho tiêu chí chấm thẳng (điểm cố định/lần)';
COMMENT ON TABLE criteria_bonus_penalty IS 'Chi tiết cho tiêu chí cộng/trừ điểm';
COMMENT ON TABLE criteria_targets IS 'Giao chỉ tiêu cho từng đơn vị theo tiêu chí';
COMMENT ON TABLE criteria_results IS 'Kết quả chấm điểm theo tiêu chí - thay thế scores table';

COMMIT;

-- ============================================
-- Verification queries (run after migration)
-- ============================================
-- SELECT 'criteria' as table_name, COUNT(*) as count FROM criteria
-- UNION ALL SELECT 'criteria_formula', COUNT(*) FROM criteria_formula
-- UNION ALL SELECT 'criteria_fixed_score', COUNT(*) FROM criteria_fixed_score
-- UNION ALL SELECT 'criteria_bonus_penalty', COUNT(*) FROM criteria_bonus_penalty
-- UNION ALL SELECT 'criteria_targets', COUNT(*) FROM criteria_targets
-- UNION ALL SELECT 'criteria_results', COUNT(*) FROM criteria_results;
