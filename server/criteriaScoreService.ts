import type { 
  Criteria, 
  CriteriaFormula, 
  CriteriaFixedScore, 
  CriteriaBonusPenalty,
  CriteriaTarget,
  CriteriaResult
} from "@shared/schema";

/**
 * Service xử lý logic tính điểm theo 4 loại tiêu chí
 * 
 * Loại 1: Định lượng (criteria_type = 1)
 * Loại 2: Định tính (criteria_type = 2)
 * Loại 3: Chấm thẳng (criteria_type = 3)
 * Loại 4: Cộng/Trừ điểm (criteria_type = 4)
 */
export class CriteriaScoreService {
  
  /**
   * Tính điểm cho tiêu chí ĐỊNH LƯỢNG (criteria_type = 1)
   * @param actual - Giá trị thực tế đạt được
   * @param target - Chỉ tiêu được giao
   * @param maxScore - Điểm tối đa của tiêu chí
   * @param formulaType - Loại công thức (1-4)
   * @param leaderActual - Giá trị thực tế của đơn vị dẫn đầu (cho formula_type = 4)
   * @returns Điểm được tính
   */
  static calculateQuantitativeScore(
    actual: number,
    target: number,
    maxScore: number,
    formulaType: number,
    leaderActual?: number
  ): number {
    if (target === 0) return 0;
    
    const achievementRate = actual / target; // Tỷ lệ đạt được
    
    switch (formulaType) {
      case 1: // Không đạt chỉ tiêu (<100%)
        // score = 0.5 × max_score × (actual/target)
        return Number((0.5 * maxScore * achievementRate).toFixed(2));
      
      case 2: // Đạt đủ chỉ tiêu (100%)
        // score = 0.5 × max_score
        if (achievementRate >= 1.0) {
          return Number((0.5 * maxScore).toFixed(2));
        }
        // Nếu không đạt, tính như formula_type = 1
        return Number((0.5 * maxScore * achievementRate).toFixed(2));
      
      case 3: // Dẫn đầu cụm (vượt chỉ tiêu và cao nhất)
        // score = max_score
        if (achievementRate > 1.0) {
          return maxScore;
        }
        // Nếu chỉ đạt đủ, cho 0.5 điểm
        return Number((0.5 * maxScore).toFixed(2));
      
      case 4: // Vượt nhưng không dẫn đầu
        // score = 0.5 × max_score + ((actual - target) / (leader_actual - target)) × (0.5 × max_score)
        if (!leaderActual || leaderActual <= target) {
          // Không có leader hoặc leader không vượt -> tính như đạt đủ
          return Number((0.5 * maxScore).toFixed(2));
        }
        
        if (actual <= target) {
          // Không vượt chỉ tiêu -> tính như formula_type = 1
          return Number((0.5 * maxScore * achievementRate).toFixed(2));
        }
        
        const excessRatio = (actual - target) / (leaderActual - target);
        const score = 0.5 * maxScore + excessRatio * (0.5 * maxScore);
        return Number(Math.min(score, maxScore).toFixed(2));
      
      default:
        return 0;
    }
  }
  
  /**
   * Tính điểm cho tiêu chí ĐỊNH TÍNH (criteria_type = 2)
   * @param isAchieved - Có đạt hay không (true/false)
   * @param maxScore - Điểm tối đa
   * @returns Điểm: maxScore nếu đạt, 0 nếu không đạt
   */
  static calculateQualitativeScore(isAchieved: boolean, maxScore: number): number {
    return isAchieved ? maxScore : 0;
  }
  
  /**
   * Tính điểm cho tiêu chí CHẤM THẲNG (criteria_type = 3)
   * @param count - Số lần/số lượng
   * @param pointPerUnit - Điểm cho mỗi lần
   * @param maxScoreLimit - Giới hạn điểm tối đa (optional)
   * @returns Điểm = count × pointPerUnit (chặn bởi maxScoreLimit nếu có)
   */
  static calculateFixedScore(
    count: number,
    pointPerUnit: number,
    maxScoreLimit?: number
  ): number {
    const score = count * pointPerUnit;
    
    if (maxScoreLimit && score > maxScoreLimit) {
      return maxScoreLimit;
    }
    
    return Number(score.toFixed(2));
  }
  
  /**
   * Tính điểm cho tiêu chí CỘNG/TRỪ (criteria_type = 4)
   * @param bonusCount - Số lần cộng điểm
   * @param penaltyCount - Số lần trừ điểm
   * @param bonusPoint - Điểm cộng mỗi lần
   * @param penaltyPoint - Điểm trừ mỗi lần
   * @param minScore - Điểm tối thiểu (optional)
   * @param maxScore - Điểm tối đa (optional)
   * @returns Điểm = (bonusCount × bonusPoint) - (penaltyCount × penaltyPoint)
   */
  static calculateBonusPenaltyScore(
    bonusCount: number,
    penaltyCount: number,
    bonusPoint: number = 0,
    penaltyPoint: number = 0,
    minScore?: number,
    maxScore?: number
  ): number {
    let score = (bonusCount * bonusPoint) - (penaltyCount * penaltyPoint);
    
    // Áp dụng giới hạn min/max
    if (minScore !== undefined && score < minScore) {
      score = minScore;
    }
    if (maxScore !== undefined && score > maxScore) {
      score = maxScore;
    }
    
    return Number(score.toFixed(2));
  }
  
  /**
   * Tính điểm tự động dựa vào loại tiêu chí và dữ liệu đầu vào
   * @param criteria - Thông tin tiêu chí
   * @param result - Kết quả đã nhập (actual_value, self_score, bonus_count, penalty_count)
   * @param formulaDetail - Chi tiết công thức (CriteriaFormula | CriteriaFixedScore | CriteriaBonusPenalty)
   * @param target - Chỉ tiêu được giao (cho định lượng)
   * @param leaderActual - Giá trị của đơn vị dẫn đầu (cho formula_type = 4)
   * @returns Điểm được tính toán
   */
  static calculateScore(
    criteria: Criteria,
    result: Partial<CriteriaResult>,
    formulaDetail?: CriteriaFormula | CriteriaFixedScore | CriteriaBonusPenalty,
    target?: CriteriaTarget,
    leaderActual?: number
  ): number {
    const maxScore = Number(criteria.maxScore);
    
    switch (criteria.criteriaType) {
      case 1: // Định lượng
        if (!result.actualValue || !target?.targetValue) {
          return 0;
        }
        return this.calculateQuantitativeScore(
          Number(result.actualValue),
          Number(target.targetValue),
          maxScore,
          criteria.formulaType || 1,
          leaderActual
        );
      
      case 2: // Định tính
        // selfScore sẽ là 0 (không đạt) hoặc maxScore (đạt)
        return result.selfScore ? Number(result.selfScore) : 0;
      
      case 3: // Chấm thẳng
        if (!result.actualValue || !formulaDetail) {
          return 0;
        }
        const fixedDetail = formulaDetail as CriteriaFixedScore;
        return this.calculateFixedScore(
          Number(result.actualValue),
          Number(fixedDetail.pointPerUnit),
          fixedDetail.maxScoreLimit ? Number(fixedDetail.maxScoreLimit) : undefined
        );
      
      case 4: // Cộng/Trừ
        if (!formulaDetail) {
          return 0;
        }
        const bonusPenaltyDetail = formulaDetail as CriteriaBonusPenalty;
        return this.calculateBonusPenaltyScore(
          result.bonusCount || 0,
          result.penaltyCount || 0,
          bonusPenaltyDetail.bonusPoint ? Number(bonusPenaltyDetail.bonusPoint) : 0,
          bonusPenaltyDetail.penaltyPoint ? Number(bonusPenaltyDetail.penaltyPoint) : 0,
          bonusPenaltyDetail.minScore ? Number(bonusPenaltyDetail.minScore) : undefined,
          bonusPenaltyDetail.maxScore ? Number(bonusPenaltyDetail.maxScore) : undefined
        );
      
      default:
        return 0;
    }
  }
  
  /**
   * Tính tổng điểm của tiêu chí cha (tổng điểm các con)
   * @param childrenScores - Mảng điểm của các tiêu chí con
   * @returns Tổng điểm
   */
  static calculateParentScore(childrenScores: number[]): number {
    const total = childrenScores.reduce((sum, score) => sum + score, 0);
    return Number(total.toFixed(2));
  }
  
  /**
   * Xác định đơn vị dẫn đầu cụm cho tiêu chí định lượng
   * @param results - Mảng kết quả của tất cả đơn vị trong cụm
   * @returns ID của đơn vị dẫn đầu và giá trị actual_value cao nhất
   */
  static findClusterLeader(results: CriteriaResult[]): { unitId: string; actualValue: number } | null {
    if (results.length === 0) return null;
    
    let leader = results[0];
    let maxActual = Number(leader.actualValue || 0);
    
    for (const result of results) {
      const actual = Number(result.actualValue || 0);
      if (actual > maxActual) {
        maxActual = actual;
        leader = result;
      }
    }
    
    return {
      unitId: leader.unitId,
      actualValue: maxActual
    };
  }
}
