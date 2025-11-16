import { db } from "./db";
import { eq, and, isNull, desc, asc, sql, or } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  Criteria, InsertCriteria, CriteriaWithChildren,
  CriteriaFormula, InsertCriteriaFormula,
  CriteriaFixedScore, InsertCriteriaFixedScore,
  CriteriaBonusPenalty, InsertCriteriaBonusPenalty,
  CriteriaTarget, InsertCriteriaTarget,
  CriteriaResult, InsertCriteriaResult
} from "@shared/schema";
import { CriteriaScoreService } from "./criteriaScoreService";

/**
 * Storage layer cho hệ thống Tiêu chí dạng cây (Tree Structure)
 */
export class CriteriaTreeStorage {
  
  // ============================================
  // CRITERIA CRUD (Tree operations)
  // ============================================
  
  /**
   * Lấy tất cả tiêu chí theo năm và cụm
   * Logic: Lấy criteria có cluster_id = clusterId HOẶC cluster_id = NULL (áp dụng cho tất cả)
   */
  async getCriteria(year: number, clusterId?: string): Promise<Criteria[]> {
    const conditions: any[] = [eq(schema.criteria.year, year)];
    
    if (clusterId) {
      // Lấy criteria cho cụm cụ thể HOẶC áp dụng cho tất cả (NULL)
      conditions.push(
        or(
          eq(schema.criteria.clusterId, clusterId),
          isNull(schema.criteria.clusterId)
        )
      );
    }
    
    const result = await db
      .select()
      .from(schema.criteria)
      .where(and(...conditions))
      .orderBy(asc(schema.criteria.level), asc(schema.criteria.orderIndex));
    
    return result;
  }
  
  /**
   * Lấy cây tiêu chí đầy đủ (recursive tree structure)
   */
  async getCriteriaTree(year: number, clusterId?: string): Promise<CriteriaWithChildren[]> {
    const allCriteria = await this.getCriteria(year, clusterId);
    
    // Build tree recursively
    const buildTree = (parentId: string | null): CriteriaWithChildren[] => {
      return allCriteria
        .filter(c => c.parentId === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };
    
    return buildTree(null);
  }
  
  /**
   * Lấy thông tin tiêu chí theo ID (kèm chi tiết formula/fixed/bonus)
   */
  async getCriteriaById(id: string): Promise<Criteria & {
    formula?: CriteriaFormula;
    fixedScore?: CriteriaFixedScore;
    bonusPenalty?: CriteriaBonusPenalty;
  } | undefined> {
    const [criteria] = await db
      .select()
      .from(schema.criteria)
      .where(eq(schema.criteria.id, id))
      .limit(1);
    
    if (!criteria) return undefined;
    
    // Load related details based on criteria type
    let formula, fixedScore, bonusPenalty;
    
    if (criteria.criteriaType === 1) {
      [formula] = await db
        .select()
        .from(schema.criteriaFormula)
        .where(eq(schema.criteriaFormula.criteriaId, id))
        .limit(1);
    } else if (criteria.criteriaType === 3) {
      [fixedScore] = await db
        .select()
        .from(schema.criteriaFixedScore)
        .where(eq(schema.criteriaFixedScore.criteriaId, id))
        .limit(1);
    } else if (criteria.criteriaType === 4) {
      [bonusPenalty] = await db
        .select()
        .from(schema.criteriaBonusPenalty)
        .where(eq(schema.criteriaBonusPenalty.criteriaId, id))
        .limit(1);
    }
    
    return {
      ...criteria,
      formula,
      fixedScore,
      bonusPenalty
    };
  }
  
  /**
   * Tạo tiêu chí mới (parent hoặc child)
   */
  async createCriteria(
    criteria: InsertCriteria,
    details?: {
      formula?: InsertCriteriaFormula;
      fixedScore?: InsertCriteriaFixedScore;
      bonusPenalty?: InsertCriteriaBonusPenalty;
    }
  ): Promise<Criteria> {
    // Insert criteria
    const [newCriteria] = await db
      .insert(schema.criteria)
      .values(criteria)
      .returning();
    
    // Insert related details based on type
    if (criteria.criteriaType === 1 && details?.formula) {
      await db.insert(schema.criteriaFormula).values({
        ...details.formula,
        criteriaId: newCriteria.id
      });
    } else if (criteria.criteriaType === 3 && details?.fixedScore) {
      await db.insert(schema.criteriaFixedScore).values({
        ...details.fixedScore,
        criteriaId: newCriteria.id
      });
    } else if (criteria.criteriaType === 4 && details?.bonusPenalty) {
      await db.insert(schema.criteriaBonusPenalty).values({
        ...details.bonusPenalty,
        criteriaId: newCriteria.id
      });
    }
    
    return newCriteria;
  }
  
  /**
   * Cập nhật tiêu chí
   */
  async updateCriteria(
    id: string,
    criteria: Partial<InsertCriteria>,
    details?: {
      formula?: Partial<InsertCriteriaFormula>;
      fixedScore?: Partial<InsertCriteriaFixedScore>;
      bonusPenalty?: Partial<InsertCriteriaBonusPenalty>;
    }
  ): Promise<Criteria | undefined> {
    const [updated] = await db
      .update(schema.criteria)
      .set({ ...criteria, updatedAt: new Date() })
      .where(eq(schema.criteria.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    // Update related details
    if (updated.criteriaType === 1 && details?.formula) {
      await db
        .update(schema.criteriaFormula)
        .set(details.formula)
        .where(eq(schema.criteriaFormula.criteriaId, id));
    } else if (updated.criteriaType === 3 && details?.fixedScore) {
      await db
        .update(schema.criteriaFixedScore)
        .set(details.fixedScore)
        .where(eq(schema.criteriaFixedScore.criteriaId, id));
    } else if (updated.criteriaType === 4 && details?.bonusPenalty) {
      await db
        .update(schema.criteriaBonusPenalty)
        .set(details.bonusPenalty)
        .where(eq(schema.criteriaBonusPenalty.criteriaId, id));
    }
    
    return updated;
  }
  
  /**
   * Xóa tiêu chí (chỉ nếu không có con)
   */
  async deleteCriteria(id: string): Promise<void> {
    // Check if has children
    const children = await db
      .select()
      .from(schema.criteria)
      .where(eq(schema.criteria.parentId, id))
      .limit(1);
    
    if (children.length > 0) {
      throw new Error("Không thể xóa tiêu chí vì đang có tiêu chí con");
    }
    
    // Check if has results
    const results = await db
      .select()
      .from(schema.criteriaResults)
      .where(eq(schema.criteriaResults.criteriaId, id))
      .limit(1);
    
    if (results.length > 0) {
      throw new Error("Không thể xóa tiêu chí vì đã có kết quả chấm điểm");
    }
    
    await db.delete(schema.criteria).where(eq(schema.criteria.id, id));
  }
  
  // ============================================
  // CRITERIA TARGETS (Giao chỉ tiêu)
  // ============================================
  
  /**
   * Giao chỉ tiêu cho đơn vị
   */
  async setCriteriaTarget(target: InsertCriteriaTarget): Promise<CriteriaTarget> {
    const [result] = await db
      .insert(schema.criteriaTargets)
      .values(target)
      .onConflictDoUpdate({
        target: [schema.criteriaTargets.criteriaId, schema.criteriaTargets.unitId, schema.criteriaTargets.year],
        set: {
          targetValue: target.targetValue,
          note: target.note,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return result;
  }
  
  /**
   * Lấy chỉ tiêu của đơn vị
   */
  async getCriteriaTargets(unitId: string, year: number): Promise<CriteriaTarget[]> {
    return await db
      .select()
      .from(schema.criteriaTargets)
      .where(and(
        eq(schema.criteriaTargets.unitId, unitId),
        eq(schema.criteriaTargets.year, year)
      ));
  }
  
  // ============================================
  // CRITERIA RESULTS (Kết quả chấm điểm)
  // ============================================
  
  /**
   * Lưu/cập nhật kết quả chấm điểm
   */
  async saveCriteriaResult(result: InsertCriteriaResult): Promise<CriteriaResult> {
    const [saved] = await db
      .insert(schema.criteriaResults)
      .values(result)
      .onConflictDoUpdate({
        target: [schema.criteriaResults.criteriaId, schema.criteriaResults.unitId, schema.criteriaResults.year],
        set: {
          actualValue: result.actualValue,
          selfScore: result.selfScore,
          bonusCount: result.bonusCount,
          penaltyCount: result.penaltyCount,
          calculatedScore: result.calculatedScore,
          clusterScore: result.clusterScore,
          finalScore: result.finalScore,
          note: result.note,
          evidenceFile: result.evidenceFile,
          status: result.status,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return saved;
  }
  
  /**
   * Tính điểm tự động cho một kết quả
   */
  async calculateCriteriaScore(
    criteriaId: string,
    unitId: string,
    year: number
  ): Promise<number> {
    // Get criteria info
    const criteria = await this.getCriteriaById(criteriaId);
    if (!criteria) throw new Error("Tiêu chí không tồn tại");
    
    // Get result
    const [result] = await db
      .select()
      .from(schema.criteriaResults)
      .where(and(
        eq(schema.criteriaResults.criteriaId, criteriaId),
        eq(schema.criteriaResults.unitId, unitId),
        eq(schema.criteriaResults.year, year)
      ))
      .limit(1);
    
    if (!result) throw new Error("Chưa có kết quả để tính điểm");
    
    // Get target (if quantitative)
    let target: CriteriaTarget | undefined;
    let leaderActual: number | undefined;
    
    if (criteria.criteriaType === 1) {
      [target] = await db
        .select()
        .from(schema.criteriaTargets)
        .where(and(
          eq(schema.criteriaTargets.criteriaId, criteriaId),
          eq(schema.criteriaTargets.unitId, unitId),
          eq(schema.criteriaTargets.year, year)
        ))
        .limit(1);
      
      // Find leader if formula_type = 4
      if (criteria.formulaType === 4) {
        // Get unit's cluster
        const [unit] = await db
          .select()
          .from(schema.units)
          .where(eq(schema.units.id, unitId))
          .limit(1);
        
        if (unit) {
          // Get all units in same cluster
          const clusterUnits = await db
            .select()
            .from(schema.units)
            .where(eq(schema.units.clusterId, unit.clusterId));
          
          const unitIds = clusterUnits.map(u => u.id);
          
          // Get all results for this criteria in the cluster
          const clusterResults = await db
            .select()
            .from(schema.criteriaResults)
            .where(and(
              eq(schema.criteriaResults.criteriaId, criteriaId),
              eq(schema.criteriaResults.year, year),
              sql`${schema.criteriaResults.unitId} = ANY(${unitIds})`
            ));
          
          const leader = CriteriaScoreService.findClusterLeader(clusterResults);
          leaderActual = leader?.actualValue;
        }
      }
    }
    
    // Get formula detail based on type
    let formulaDetail: any;
    if (criteria.criteriaType === 1) {
      formulaDetail = criteria.formula;
    } else if (criteria.criteriaType === 3) {
      formulaDetail = criteria.fixedScore;
    } else if (criteria.criteriaType === 4) {
      formulaDetail = criteria.bonusPenalty;
    }
    
    // Calculate score
    const calculatedScore = CriteriaScoreService.calculateScore(
      criteria,
      result,
      formulaDetail,
      target,
      leaderActual
    );
    
    // Update result with calculated score
    await db
      .update(schema.criteriaResults)
      .set({
        calculatedScore: calculatedScore.toString(),
        finalScore: calculatedScore.toString(), // Default final = calculated
        updatedAt: new Date()
      })
      .where(and(
        eq(schema.criteriaResults.criteriaId, criteriaId),
        eq(schema.criteriaResults.unitId, unitId),
        eq(schema.criteriaResults.year, year)
      ));
    
    return calculatedScore;
  }
  
  /**
   * Lấy kết quả chấm điểm của đơn vị
   */
  async getCriteriaResults(unitId: string, year: number): Promise<CriteriaResult[]> {
    return await db
      .select()
      .from(schema.criteriaResults)
      .where(and(
        eq(schema.criteriaResults.unitId, unitId),
        eq(schema.criteriaResults.year, year)
      ));
  }
  
  /**
   * Tính tổng điểm của đơn vị (chỉ tính tiêu chí lá)
   */
  async calculateUnitTotalScore(unitId: string, year: number): Promise<{
    total: number;
    byType: { [key: number]: number };
    details: Array<{ criteriaId: string; criteriaName: string; score: number }>;
  }> {
    const results = await this.getCriteriaResults(unitId, year);
    const allCriteria = await this.getCriteria(year);
    
    // Find leaf criteria (no children)
    const leafCriteriaIds = allCriteria
      .filter(c => !allCriteria.some(child => child.parentId === c.id))
      .map(c => c.id);
    
    // Filter results to only leaf criteria
    const leafResults = results.filter(r => leafCriteriaIds.includes(r.criteriaId));
    
    let total = 0;
    const byType: { [key: number]: number } = {};
    const details: Array<{ criteriaId: string; criteriaName: string; score: number }> = [];
    
    for (const result of leafResults) {
      const score = Number(result.finalScore || result.calculatedScore || 0);
      total += score;
      
      const criteria = allCriteria.find(c => c.id === result.criteriaId);
      if (criteria) {
        byType[criteria.criteriaType] = (byType[criteria.criteriaType] || 0) + score;
        details.push({
          criteriaId: criteria.id,
          criteriaName: criteria.name,
          score
        });
      }
    }
    
    return {
      total: Number(total.toFixed(2)),
      byType,
      details
    };
  }
}

// Export singleton instance
export const criteriaTreeStorage = new CriteriaTreeStorage();
