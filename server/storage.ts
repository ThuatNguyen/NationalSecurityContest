import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, sql as sqlExpr } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser,
  Cluster, InsertCluster,
  Unit, InsertUnit,
  CriteriaGroup, InsertCriteriaGroup,
  Criteria, InsertCriteria,
  EvaluationPeriod, InsertEvaluationPeriod,
  Evaluation, InsertEvaluation,
  Score, InsertScore
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export interface IStorage {
  // Users
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
  
  // Criteria Groups
  getCriteriaGroups(clusterId: string, year: number): Promise<CriteriaGroup[]>;
  getCriteriaGroup(id: string): Promise<CriteriaGroup | undefined>;
  createCriteriaGroup(group: InsertCriteriaGroup): Promise<CriteriaGroup>;
  updateCriteriaGroup(id: string, group: Partial<InsertCriteriaGroup>): Promise<CriteriaGroup | undefined>;
  deleteCriteriaGroup(id: string): Promise<void>;
  
  // Criteria
  getCriteria(groupId: string): Promise<Criteria[]>;
  getCriteriaById(id: string): Promise<Criteria | undefined>;
  createCriteria(criteria: InsertCriteria): Promise<Criteria>;
  updateCriteria(id: string, criteria: Partial<InsertCriteria>): Promise<Criteria | undefined>;
  deleteCriteria(id: string): Promise<void>;
  
  // Evaluation Periods
  getEvaluationPeriods(clusterId?: string): Promise<EvaluationPeriod[]>;
  getEvaluationPeriod(id: string): Promise<EvaluationPeriod | undefined>;
  createEvaluationPeriod(period: InsertEvaluationPeriod): Promise<EvaluationPeriod>;
  updateEvaluationPeriod(id: string, period: Partial<InsertEvaluationPeriod>): Promise<EvaluationPeriod | undefined>;
  deleteEvaluationPeriod(id: string): Promise<void>;
  
  // Evaluations
  getEvaluations(periodId?: string, unitId?: string): Promise<Evaluation[]>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation | undefined>;
  
  // Scores
  getScores(evaluationId: string): Promise<Score[]>;
  getScore(id: string): Promise<Score | undefined>;
  createScore(score: InsertScore): Promise<Score>;
  updateScore(id: string, score: Partial<InsertScore>): Promise<Score | undefined>;
  
  // Evaluation Summary (aggregated data for evaluation periods page)
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
    const result = await db.insert(schema.clusters).values(cluster).returning();
    return result[0];
  }

  async updateCluster(id: string, cluster: Partial<InsertCluster>): Promise<Cluster | undefined> {
    const result = await db.update(schema.clusters).set(cluster).where(eq(schema.clusters.id, id)).returning();
    return result[0];
  }

  async deleteCluster(id: string): Promise<void> {
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
    const result = await db.insert(schema.units).values(unit).returning();
    return result[0];
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit | undefined> {
    const result = await db.update(schema.units).set(unit).where(eq(schema.units.id, id)).returning();
    return result[0];
  }

  async deleteUnit(id: string): Promise<void> {
    await db.delete(schema.units).where(eq(schema.units.id, id));
  }

  // Criteria Groups
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

  // Criteria
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
}

export const storage = new DatabaseStorage();
