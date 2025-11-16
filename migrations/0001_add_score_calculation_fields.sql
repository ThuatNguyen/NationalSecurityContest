-- Migration: Add fields to scores table for supporting all 4 criteria types
-- Type 1 (Quantitative): actualValue (số liệu thực hiện)
-- Type 2 (Qualitative): isAchieved (đạt/không đạt) - can use selfScore as 0 or maxScore
-- Type 3 (Fixed): count (số lần đạt)
-- Type 4 (Bonus/Penalty): bonusCount, penaltyCount

BEGIN;

ALTER TABLE scores ADD COLUMN IF NOT EXISTS actual_value DECIMAL(10, 2);
COMMENT ON COLUMN scores.actual_value IS 'Số liệu thực hiện (cho tiêu chí định lượng type=1)';

ALTER TABLE scores ADD COLUMN IF NOT EXISTS count INTEGER;
COMMENT ON COLUMN scores.count IS 'Số lần đạt (cho tiêu chí chấm thẳng type=3)';

ALTER TABLE scores ADD COLUMN IF NOT EXISTS bonus_count INTEGER DEFAULT 0;
COMMENT ON COLUMN scores.bonus_count IS 'Số lần cộng điểm (cho tiêu chí +/- type=4)';

ALTER TABLE scores ADD COLUMN IF NOT EXISTS penalty_count INTEGER DEFAULT 0;
COMMENT ON COLUMN scores.penalty_count IS 'Số lần trừ điểm (cho tiêu chí +/- type=4)';

ALTER TABLE scores ADD COLUMN IF NOT EXISTS is_achieved BOOLEAN;
COMMENT ON COLUMN scores.is_achieved IS 'Đạt/không đạt (cho tiêu chí định tính type=2, true=đạt=max_score, false/null=không đạt=0)';

ALTER TABLE scores ADD COLUMN IF NOT EXISTS calculated_score DECIMAL(7, 2);
COMMENT ON COLUMN scores.calculated_score IS 'Điểm hệ thống tính tự động (dựa trên công thức)';

COMMIT;
