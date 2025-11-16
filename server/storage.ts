import { db } from "./db";
import { eq, and, sql as sqlExpr } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser,
  Cluster, InsertCluster,
  Unit, InsertUnit,
  // CriteriaGroup, InsertCriteriaGroup, // OLD - removed with tree refactor
  // Criteria, InsertCriteria, // OLD - removed with tree refactor
  EvaluationPeriod, InsertEvaluationPeriod,
  Evaluation, InsertEvaluation,
  Score, InsertScore
} from "@shared/schema";

export interface IStorage {
  // Usersnpm install -g npm@11.6.2
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Clusters
  getClusters(): Promise<Cluster[]>;
  getCluster(id: string): Promise<Cluster | undefined>;
  createCluster(cluster: InsertCluster): Promise<Cluster>;
  updateCluster(id: string, cluster: Partial<InsertCluster>): Promise<Cluster | undefined>;
  deleteCluster(id: string): Promise<void>;
  
  // Units
  getUnits(clusterId?: string): Promise<Unit[]>;
  getUnit(id: string): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: string): Promise<void>;
  
  // OLD CRITERIA GROUPS & CRITERIA METHODS - DISABLED
  // These methods use the old flat criteria_groups table structure
  // See server/criteriaTreeStorage.ts for new tree-based methods
  /*
  getCriteriaGroups(clusterId: string, year: number): Promise<CriteriaGroup[]>;
  getCriteriaGroup(id: string): Promise<CriteriaGroup | undefined>;
  createCriteriaGroup(group: InsertCriteriaGroup): Promise<CriteriaGroup>;
  updateCriteriaGroup(id: string, group: Partial<InsertCriteriaGroup>): Promise<CriteriaGroup | undefined>;
  deleteCriteriaGroup(id: string): Promise<void>;
  
  getCriteria(groupId: string): Promise<Criteria[]>;
  getCriteriaById(id: string): Promise<Criteria | undefined>;
  createCriteria(criteria: InsertCriteria): Promise<Criteria>;
  updateCriteria(id: string, criteria: Partial<InsertCriteria>): Promise<Criteria | undefined>;
  deleteCriteria(id: string): Promise<void>;
  */
  
  // Evaluation Periods
  getEvaluationPeriods(clusterId?: string): Promise<EvaluationPeriod[]>;
  getEvaluationPeriod(id: string): Promise<EvaluationPeriod | undefined>;
  createEvaluationPeriod(period: InsertEvaluationPeriod): Promise<EvaluationPeriod>;
  updateEvaluationPeriod(id: string, period: Partial<InsertEvaluationPeriod>): Promise<EvaluationPeriod | undefined>;
  deleteEvaluationPeriod(id: string): Promise<void>;
  
  // Evaluations
  getEvaluations(periodId?: string, unitId?: string): Promise<Evaluation[]>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  getEvaluationByPeriodUnit(periodId: string, unitId: string): Promise<Evaluation | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation | undefined>;
  
  // Scores
  getScores(evaluationId: string): Promise<Score[]>;
  getScore(id: string): Promise<Score | undefined>;
  createScore(score: InsertScore): Promise<Score>;
  updateScore(id: string, score: Partial<InsertScore>): Promise<Score | undefined>;
  
  // Recalculation (transactional)
  recalculateEvaluationScoresTx(evaluationId: string): Promise<{ scoresUpdated: number }>;
  
  // NEW EVALUATION SUMMARY METHOD - Tree-based
  getEvaluationSummaryTree(periodId: string, unitId: string): Promise<{
    period: EvaluationPeriod;
    evaluation: Evaluation | null;
    criteriaGroups: Array<{
      id: string;
      name: string;
      displayOrder: number;
      criteria: Array<{
        id: string;
        name: string;
        maxScore: number;
        displayOrder: number;
        selfScore?: number;
        selfScoreFile?: string | null;
        review1Score?: number;
        review1Comment?: string | null;
        review1File?: string | null;
        review2Score?: number;
        review2Comment?: string | null;
        review2File?: string | null;
        finalScore?: number;
      }>;
    }>;
  } | null>;
  
  // OLD EVALUATION SUMMARY METHOD - DISABLED
  // This method uses the old flat criteria_groups table structure
  /*
  getEvaluationSummary(periodId: string, unitId: string): Promise<{
    period: EvaluationPeriod;
    evaluation: Evaluation | null;
    criteriaGroups: Array<{
      id: string;
      name: string;
      displayOrder: number;
      criteria: Array<{
        id: string;
        name: string;
        maxScore: string;
        displayOrder: number;
        selfScore?: string | null;
        selfScoreFile?: string | null;
        review1Score?: string | null;
        review1Comment?: string | null;
        review1File?: string | null;
        review2Score?: string | null;
        review2Comment?: string | null;
        review2File?: string | null;
        finalScore?: string | null;
      }>;
    }>;
  } | null>;
  */
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  // Clusters
  async getClusters(): Promise<Cluster[]> {
    return await db.select().from(schema.clusters);
  }

  async getCluster(id: string): Promise<Cluster | undefined> {
    const result = await db.select().from(schema.clusters).where(eq(schema.clusters.id, id)).limit(1);
    return result[0];
  }

  async createCluster(cluster: InsertCluster): Promise<Cluster> {
    // Check for duplicate name
    const existingByName = await db.select().from(schema.clusters)
      .where(eq(schema.clusters.name, cluster.name))
      .limit(1);
    if (existingByName.length > 0) {
      throw new Error('Tên cụm thi đua đã tồn tại');
    }
    
    // Check for duplicate short_name
    const existingByShortName = await db.select().from(schema.clusters)
      .where(eq(schema.clusters.shortName, cluster.shortName))
      .limit(1);
    if (existingByShortName.length > 0) {
      throw new Error('Tên viết tắt cụm thi đua đã tồn tại');
    }
    
    const result = await db.insert(schema.clusters).values(cluster).returning();
    return result[0];
  }

  async updateCluster(id: string, cluster: Partial<InsertCluster>): Promise<Cluster | undefined> {
    // Check for duplicate name (excluding current cluster)
    if (cluster.name) {
      const existingByName = await db.select().from(schema.clusters)
        .where(and(
          eq(schema.clusters.name, cluster.name),
          sqlExpr`${schema.clusters.id} != ${id}`
        ))
        .limit(1);
      if (existingByName.length > 0) {
        throw new Error('Tên cụm thi đua đã tồn tại');
      }
    }
    
    // Check for duplicate short_name (excluding current cluster)
    if (cluster.shortName) {
      const existingByShortName = await db.select().from(schema.clusters)
        .where(and(
          eq(schema.clusters.shortName, cluster.shortName),
          sqlExpr`${schema.clusters.id} != ${id}`
        ))
        .limit(1);
      if (existingByShortName.length > 0) {
        throw new Error('Tên viết tắt cụm thi đua đã tồn tại');
      }
    }
    
    const result = await db.update(schema.clusters).set({
      ...cluster,
      updatedAt: new Date(),
    }).where(eq(schema.clusters.id, id)).returning();
    return result[0];
  }

  async deleteCluster(id: string): Promise<void> {
    // Check if cluster has any units
    const units = await db.select().from(schema.units)
      .where(eq(schema.units.clusterId, id))
      .limit(1);
    
    if (units.length > 0) {
      throw new Error('Không thể xóa cụm thi đua vì đang có đơn vị trực thuộc');
    }
    
    await db.delete(schema.clusters).where(eq(schema.clusters.id, id));
  }

  // Units
  async getUnits(clusterId?: string): Promise<Unit[]> {
    if (clusterId) {
      return await db.select().from(schema.units).where(eq(schema.units.clusterId, clusterId));
    }
    return await db.select().from(schema.units);
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    const result = await db.select().from(schema.units).where(eq(schema.units.id, id)).limit(1);
    return result[0];
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    // Check for duplicate name
    const existingByName = await db.select().from(schema.units)
      .where(eq(schema.units.name, unit.name))
      .limit(1);
    if (existingByName.length > 0) {
      throw new Error('Tên đơn vị đã tồn tại');
    }
    
    // Check for duplicate short_name
    const existingByShortName = await db.select().from(schema.units)
      .where(eq(schema.units.shortName, unit.shortName))
      .limit(1);
    if (existingByShortName.length > 0) {
      throw new Error('Tên viết tắt đơn vị đã tồn tại');
    }
    
    const result = await db.insert(schema.units).values(unit).returning();
    return result[0];
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit | undefined> {
    // Check for duplicate name (excluding current unit)
    if (unit.name) {
      const existingByName = await db.select().from(schema.units)
        .where(and(
          eq(schema.units.name, unit.name),
          sqlExpr`${schema.units.id} != ${id}`
        ))
        .limit(1);
      if (existingByName.length > 0) {
        throw new Error('Tên đơn vị đã tồn tại');
      }
    }
    
    // Check for duplicate short_name (excluding current unit)
    if (unit.shortName) {
      const existingByShortName = await db.select().from(schema.units)
        .where(and(
          eq(schema.units.shortName, unit.shortName),
          sqlExpr`${schema.units.id} != ${id}`
        ))
        .limit(1);
      if (existingByShortName.length > 0) {
        throw new Error('Tên viết tắt đơn vị đã tồn tại');
      }
    }
    
    const result = await db.update(schema.units).set({
      ...unit,
      updatedAt: new Date(),
    }).where(eq(schema.units.id, id)).returning();
    return result[0];
  }

  async deleteUnit(id: string): Promise<void> {
    // Check if unit has any evaluations (being used in scoring)
    const evaluations = await db.select().from(schema.evaluations)
      .where(eq(schema.evaluations.unitId, id))
      .limit(1);
    
    if (evaluations.length > 0) {
      throw new Error('Không thể xóa đơn vị vì đang được sử dụng trong đánh giá');
    }
    
    // Check if unit has any users
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.unitId, id))
      .limit(1);
    
    if (users.length > 0) {
      throw new Error('Không thể xóa đơn vị vì đang có người dùng trực thuộc');
    }
    
    await db.delete(schema.units).where(eq(schema.units.id, id));
  }

  // OLD CRITERIA GROUPS & CRITERIA IMPLEMENTATIONS - DISABLED
  // These methods use the old flat criteria_groups table structure
  // See server/criteriaTreeStorage.ts for new tree-based methods
  /*
  async getCriteriaGroups(clusterId: string, year: number): Promise<CriteriaGroup[]> {
    return await db.select().from(schema.criteriaGroups)
      .where(and(
        eq(schema.criteriaGroups.clusterId, clusterId),
        eq(schema.criteriaGroups.year, year)
      ));
  }

  async getCriteriaGroup(id: string): Promise<CriteriaGroup | undefined> {
    const result = await db.select().from(schema.criteriaGroups).where(eq(schema.criteriaGroups.id, id)).limit(1);
    return result[0];
  }

  async createCriteriaGroup(group: InsertCriteriaGroup): Promise<CriteriaGroup> {
    const result = await db.insert(schema.criteriaGroups).values(group).returning();
    return result[0];
  }

  async updateCriteriaGroup(id: string, group: Partial<InsertCriteriaGroup>): Promise<CriteriaGroup | undefined> {
    const result = await db.update(schema.criteriaGroups).set(group).where(eq(schema.criteriaGroups.id, id)).returning();
    return result[0];
  }

  async deleteCriteriaGroup(id: string): Promise<void> {
    await db.delete(schema.criteriaGroups).where(eq(schema.criteriaGroups.id, id));
  }

  async getCriteria(groupId: string): Promise<Criteria[]> {
    return await db.select().from(schema.criteria).where(eq(schema.criteria.groupId, groupId));
  }

  async getCriteriaById(id: string): Promise<Criteria | undefined> {
    const result = await db.select().from(schema.criteria).where(eq(schema.criteria.id, id)).limit(1);
    return result[0];
  }

  async createCriteria(criteria: InsertCriteria): Promise<Criteria> {
    const result = await db.insert(schema.criteria).values(criteria).returning();
    return result[0];
  }

  async updateCriteria(id: string, criteria: Partial<InsertCriteria>): Promise<Criteria | undefined> {
    const result = await db.update(schema.criteria).set(criteria).where(eq(schema.criteria.id, id)).returning();
    return result[0];
  }

  async deleteCriteria(id: string): Promise<void> {
    await db.delete(schema.criteria).where(eq(schema.criteria.id, id));
  }
  */

  // Evaluation Periods
  async getEvaluationPeriods(clusterId?: string): Promise<EvaluationPeriod[]> {
    if (clusterId) {
      return await db.select().from(schema.evaluationPeriods).where(eq(schema.evaluationPeriods.clusterId, clusterId));
    }
    return await db.select().from(schema.evaluationPeriods);
  }

  async getEvaluationPeriod(id: string): Promise<EvaluationPeriod | undefined> {
    const result = await db.select().from(schema.evaluationPeriods).where(eq(schema.evaluationPeriods.id, id)).limit(1);
    return result[0];
  }

  async createEvaluationPeriod(period: InsertEvaluationPeriod): Promise<EvaluationPeriod> {
    const result = await db.insert(schema.evaluationPeriods).values(period).returning();
    return result[0];
  }

  async updateEvaluationPeriod(id: string, period: Partial<InsertEvaluationPeriod>): Promise<EvaluationPeriod | undefined> {
    const result = await db.update(schema.evaluationPeriods).set(period).where(eq(schema.evaluationPeriods.id, id)).returning();
    return result[0];
  }

  async deleteEvaluationPeriod(id: string): Promise<void> {
    await db.delete(schema.evaluationPeriods).where(eq(schema.evaluationPeriods.id, id));
  }

  // Evaluations
  async getEvaluations(periodId?: string, unitId?: string): Promise<Evaluation[]> {
    const conditions = [];
    if (periodId) {
      conditions.push(eq(schema.evaluations.periodId, periodId));
    }
    if (unitId) {
      conditions.push(eq(schema.evaluations.unitId, unitId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(schema.evaluations).where(and(...conditions));
    }
    return await db.select().from(schema.evaluations);
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    const result = await db.select().from(schema.evaluations).where(eq(schema.evaluations.id, id)).limit(1);
    return result[0];
  }

  async getEvaluationByPeriodUnit(periodId: string, unitId: string): Promise<Evaluation | undefined> {
    const result = await db.select().from(schema.evaluations)
      .where(and(
        eq(schema.evaluations.periodId, periodId),
        eq(schema.evaluations.unitId, unitId)
      ))
      .limit(1);
    return result[0];
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const result = await db.insert(schema.evaluations).values(evaluation).returning();
    return result[0];
  }

  async updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation | undefined> {
    const result = await db.update(schema.evaluations).set(evaluation).where(eq(schema.evaluations.id, id)).returning();
    return result[0];
  }

  // Scores
  async getScores(evaluationId: string): Promise<Score[]> {
    return await db.select().from(schema.scores).where(eq(schema.scores.evaluationId, evaluationId));
  }

  async getScore(id: string): Promise<Score | undefined> {
    const result = await db.select().from(schema.scores).where(eq(schema.scores.id, id)).limit(1);
    return result[0];
  }

  async createScore(score: InsertScore): Promise<Score> {
    const result = await db.insert(schema.scores).values(score).returning();
    return result[0];
  }

  async updateScore(id: string, score: Partial<InsertScore>): Promise<Score | undefined> {
    const result = await db.update(schema.scores).set(score).where(eq(schema.scores.id, id)).returning();
    return result[0];
  }

  // OLD EVALUATION SUMMARY IMPLEMENTATION - DISABLED
  // This method uses the old flat criteria_groups table structure
  /*
  async getEvaluationSummary(periodId: string, unitId: string) {
    // 1. Fetch period (fail fast if missing)
    const period = await this.getEvaluationPeriod(periodId);
    if (!period) {
      return null;
    }

    // 2. Fetch evaluation for this period and unit (may be null)
    const evaluations = await this.getEvaluations(periodId, unitId);
    const evaluation = evaluations.length > 0 ? evaluations[0] : null;

    // 3. Single query: JOIN criteria_groups, criteria, and scores
    // This eliminates N+1 queries and ensures proper ordering
    // When no evaluation exists, scores will be null (no data leak)
    const rows = await db
      .select({
        groupId: schema.criteriaGroups.id,
        groupName: schema.criteriaGroups.name,
        groupDisplayOrder: schema.criteriaGroups.displayOrder,
        criteriaId: schema.criteria.id,
        criteriaName: schema.criteria.name,
        criteriaMaxScore: schema.criteria.maxScore,
        criteriaDisplayOrder: schema.criteria.displayOrder,
        selfScore: schema.scores.selfScore,
        selfScoreFile: schema.scores.selfScoreFile,
        review1Score: schema.scores.review1Score,
        review1Comment: schema.scores.review1Comment,
        review1File: schema.scores.review1File,
        review2Score: schema.scores.review2Score,
        review2Comment: schema.scores.review2Comment,
        review2File: schema.scores.review2File,
        finalScore: schema.scores.finalScore,
      })
      .from(schema.criteriaGroups)
      .innerJoin(schema.criteria, eq(schema.criteria.groupId, schema.criteriaGroups.id))
      .leftJoin(
        schema.scores,
        evaluation
          ? and(
              eq(schema.scores.criteriaId, schema.criteria.id),
              eq(schema.scores.evaluationId, evaluation.id)
            )
          : sqlExpr`false` // No evaluation = no scores (prevents data leak)
      )
      .where(
        and(
          eq(schema.criteriaGroups.clusterId, period.clusterId),
          eq(schema.criteriaGroups.year, period.year)
        )
      )
      .orderBy(schema.criteriaGroups.displayOrder, schema.criteria.displayOrder);

    // 4. Regroup rows by criteria group
    const groupMap = new Map<string, {
      id: string;
      name: string;
      displayOrder: number;
      criteria: Array<{
        id: string;
        name: string;
        maxScore: string;
        displayOrder: number;
        selfScore?: string | null;
        selfScoreFile?: string | null;
        review1Score?: string | null;
        review1Comment?: string | null;
        review1File?: string | null;
        review2Score?: string | null;
        review2Comment?: string | null;
        review2File?: string | null;
        finalScore?: string | null;
      }>;
    }>();

    for (const row of rows) {
      let group = groupMap.get(row.groupId);
      if (!group) {
        group = {
          id: row.groupId,
          name: row.groupName,
          displayOrder: row.groupDisplayOrder,
          criteria: [],
        };
        groupMap.set(row.groupId, group);
      }

      group.criteria.push({
        id: row.criteriaId,
        name: row.criteriaName,
        maxScore: row.criteriaMaxScore,
        displayOrder: row.criteriaDisplayOrder,
        selfScore: row.selfScore,
        selfScoreFile: row.selfScoreFile,
        review1Score: row.review1Score,
        review1Comment: row.review1Comment,
        review1File: row.review1File,
        review2Score: row.review2Score,
        review2Comment: row.review2Comment,
        review2File: row.review2File,
        finalScore: row.finalScore,
      });
    }

    const criteriaGroups = Array.from(groupMap.values());

    return {
      period,
      evaluation,
      criteriaGroups,
    };
  }
  */

  // Recalculate finalScores (transactional)
  async recalculateEvaluationScoresTx(evaluationId: string): Promise<{ scoresUpdated: number }> {
    return await db.transaction(async (tx) => {
      // Fetch all scores for this evaluation within transaction
      const scores = await tx.select().from(schema.scores).where(eq(schema.scores.evaluationId, evaluationId));
      
      // Precompute finalScore and totals in memory
      let totalSelfScore = 0;
      let totalReview1Score = 0;
      let totalReview2Score = 0;
      let totalFinalScore = 0;
      
      // Track whether we have ANY review scores (to distinguish 0 from null)
      let hasAnyReview1 = false;
      let hasAnyReview2 = false;
      
      const updates: Array<{ id: string; finalScore: string }> = [];
      
      for (const score of scores) {
        const selfScore = score.selfScore ? parseFloat(score.selfScore) : 0;
        const review1Score = score.review1Score ? parseFloat(score.review1Score) : null;
        const review2Score = score.review2Score ? parseFloat(score.review2Score) : null;
        
        // Calculate finalScore using MAX logic
        let finalScore: number;
        if (review1Score !== null && review2Score !== null) {
          finalScore = Math.max(review1Score, review2Score);
        } else if (review1Score !== null) {
          finalScore = review1Score;
        } else if (review2Score !== null) {
          finalScore = review2Score;
        } else {
          finalScore = selfScore;
        }
        
        updates.push({ id: score.id, finalScore: finalScore.toString() });
        
        // Accumulate totals
        totalSelfScore += selfScore;
        if (review1Score !== null) {
          totalReview1Score += review1Score;
          hasAnyReview1 = true;
        }
        if (review2Score !== null) {
          totalReview2Score += review2Score;
          hasAnyReview2 = true;
        }
        totalFinalScore += finalScore;
      }
      
      // Update all scores within transaction
      for (const update of updates) {
        await tx.update(schema.scores).set({ finalScore: update.finalScore }).where(eq(schema.scores.id, update.id));
      }
      
      // Update evaluation totals within same transaction
      // Preserve zero totals (scored as zero) vs null (not scored)
      await tx.update(schema.evaluations).set({
        totalSelfScore: totalSelfScore.toString(),
        totalReview1Score: hasAnyReview1 ? totalReview1Score.toString() : null,
        totalReview2Score: hasAnyReview2 ? totalReview2Score.toString() : null,
        totalFinalScore: totalFinalScore.toString(),
      }).where(eq(schema.evaluations.id, evaluationId));
      
      return { scoresUpdated: scores.length };
    });
  }

  // NEW EVALUATION SUMMARY METHOD - Tree-based criteria
  async getEvaluationSummaryTree(periodId: string, unitId: string) {
    // Get evaluation period
    const period = await this.getEvaluationPeriod(periodId);
    if (!period) return null;

    // Get evaluation (or return null if not exists yet)
    const evaluation = await this.getEvaluationByPeriodUnit(periodId, unitId) || null;

    // Get criteria tree for this period's year and cluster
    const criteriaTreeStorage = (await import('./criteriaTreeStorage')).criteriaTreeStorage;
    const criteriaTree = await criteriaTreeStorage.getCriteriaTree(period.year, period.clusterId);

    // Get all scores for this evaluation
    const scores = evaluation ? await this.getScores(evaluation.id) : [];
    const scoresMap = new Map(scores.map(s => [s.criteriaId, s]));

    // Transform tree into flat groups by level 1 nodes
    const flattenTree = (node: any, parentPath: string = ''): any[] => {
      const currentPath = parentPath ? `${parentPath}.${node.orderIndex}` : node.code || node.id.substring(0, 8);
      const score = scoresMap.get(node.id);

      const flatNode = {
        id: node.id,
        name: node.name,
        maxScore: parseFloat(node.maxScore),
        displayOrder: node.orderIndex,
        level: node.level,
        code: node.code || currentPath,
        selfScore: score?.selfScore ? parseFloat(score.selfScore) : undefined,
        selfScoreFile: score?.selfScoreFile || null,
        review1Score: score?.review1Score ? parseFloat(score.review1Score) : undefined,
        review1Comment: score?.review1Comment || null,
        review1File: score?.review1File || null,
        review2Score: score?.review2Score ? parseFloat(score.review2Score) : undefined,
        review2Comment: score?.review2Comment || null,
        review2File: score?.review2File || null,
        finalScore: score?.finalScore ? parseFloat(score.finalScore) : undefined,
      };

      // Recursively flatten children
      const childrenFlat = (node.children || []).flatMap((child: any) => 
        flattenTree(child, currentPath)
      );

      return [flatNode, ...childrenFlat];
    };

    // Group by level 1 nodes
    const criteriaGroups = criteriaTree.map((level1Node, index) => ({
      id: level1Node.id,
      name: level1Node.name,
      displayOrder: level1Node.orderIndex,
      criteria: flattenTree(level1Node)
    }));

    return {
      period,
      evaluation,
      criteriaGroups,
    };
  }
}

export const storage = new DatabaseStorage();
