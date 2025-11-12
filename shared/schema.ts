import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clusters (Cụm thi đua) - defined first for foreign key references
export const clusters = pgTable("clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Units (Đơn vị)
export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // admin, cluster_leader, user
  clusterId: varchar("cluster_id").references(() => clusters.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => units.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClusterSchema = createInsertSchema(clusters).omit({
  id: true,
  createdAt: true,
});

export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type Cluster = typeof clusters.$inferSelect;

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Criteria Groups (Nhóm tiêu chí)
export const criteriaGroups = pgTable("criteria_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull(),
  year: integer("year").notNull(),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCriteriaGroupSchema = createInsertSchema(criteriaGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertCriteriaGroup = z.infer<typeof insertCriteriaGroupSchema>;
export type CriteriaGroup = typeof criteriaGroups.$inferSelect;

// Criteria (Tiêu chí cụ thể)
export const criteria = pgTable("criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  groupId: varchar("group_id").notNull().references(() => criteriaGroups.id, { onDelete: "cascade" }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCriteriaSchema = createInsertSchema(criteria).omit({
  id: true,
  createdAt: true,
});

export type InsertCriteria = z.infer<typeof insertCriteriaSchema>;
export type Criteria = typeof criteria.$inferSelect;

// Evaluation Periods (Kỳ thi đua)
export const evaluationPeriods = pgTable("evaluation_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, review1, review2, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEvaluationPeriodSchema = createInsertSchema(evaluationPeriods).omit({
  id: true,
  createdAt: true,
});

export type InsertEvaluationPeriod = z.infer<typeof insertEvaluationPeriodSchema>;
export type EvaluationPeriod = typeof evaluationPeriods.$inferSelect;

// Evaluations (Đánh giá cho từng đơn vị trong kỳ)
export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => evaluationPeriods.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"), // draft, submitted, review1_completed, explanation_submitted, review2_completed, finalized
  totalSelfScore: decimal("total_self_score", { precision: 7, scale: 2 }),
  totalReview1Score: decimal("total_review1_score", { precision: 7, scale: 2 }),
  totalReview2Score: decimal("total_review2_score", { precision: 7, scale: 2 }),
  totalFinalScore: decimal("total_final_score", { precision: 7, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUnitPerPeriod: unique().on(table.periodId, table.unitId),
}));

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

// Scores (Điểm cho từng tiêu chí - multi-stage workflow)
export const scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evaluationId: varchar("evaluation_id").notNull().references(() => evaluations.id, { onDelete: "cascade" }),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }),
  
  // Self-scoring stage
  selfScore: decimal("self_score", { precision: 5, scale: 2 }),
  selfScoreFile: text("self_score_file"),
  selfScoreDate: timestamp("self_score_date"),
  
  // Review 1 stage
  review1Score: decimal("review1_score", { precision: 5, scale: 2 }),
  review1Comment: text("review1_comment"),
  review1File: text("review1_file"),
  review1Date: timestamp("review1_date"),
  review1By: varchar("review1_by").references(() => users.id, { onDelete: "set null" }),
  
  // Explanation stage
  explanation: text("explanation"),
  explanationDate: timestamp("explanation_date"),
  
  // Review 2 stage
  review2Score: decimal("review2_score", { precision: 5, scale: 2 }),
  review2Comment: text("review2_comment"),
  review2File: text("review2_file"),
  review2Date: timestamp("review2_date"),
  review2By: varchar("review2_by").references(() => users.id, { onDelete: "set null" }),
  
  // Final score
  finalScore: decimal("final_score", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCriteriaPerEvaluation: unique().on(table.evaluationId, table.criteriaId),
}));

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
