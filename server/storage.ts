import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // Users
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
}

export const storage = new DatabaseStorage();
