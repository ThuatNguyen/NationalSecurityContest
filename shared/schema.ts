import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clusters (Cụm thi đua) - defined first for foreign key references
export const clusters = pgTable("clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  shortName: text("short_name").notNull().unique(),
  clusterType: text("cluster_type").notNull(), // phong, xa_phuong, khac
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Units (Đơn vị)
export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  shortName: text("short_name").notNull().unique(),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "restrict" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  updatedAt: true,
});

export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type Cluster = typeof clusters.$inferSelect;

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Criteria (Tiêu chí dạng cây n cấp)
export const criteria = pgTable("criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").references((): any => criteria.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(1), // 1, 2, 3, 4...
  name: text("name").notNull(),
  code: text("code"), // Mã tiêu chí (VD: I, II, 1.1, 1.2.3)
  description: text("description"),
  maxScore: decimal("max_score", { precision: 7, scale: 2 }).notNull().default('0'),
  
  // Loại tiêu chí (0=tiêu chí cha/không chấm điểm, 1-4=tiêu chí lá/có chấm điểm)
  criteriaType: integer("criteria_type").notNull().default(0), // 0=cha, 1=định lượng, 2=định tính, 3=chấm thẳng, 4=cộng/trừ
  
  // Cho tiêu chí định lượng (chỉ khi criteriaType=1)
  formulaType: integer("formula_type"), // 1=không đạt (<100%), 2=đạt đủ (=100%), 3=dẫn đầu, 4=vượt nhưng không dẫn đầu
  
  orderIndex: integer("order_index").notNull().default(0),
  
  // Áp dụng theo kỳ thi đua và cụm (required)
  periodId: varchar("period_id").notNull().references(() => evaluationPeriods.id, { onDelete: "cascade" }),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  
  isActive: integer("is_active").notNull().default(1), // 1=active, 0=inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Composite index for efficient filtering
  periodClusterIdx: index("criteria_period_cluster_idx").on(table.periodId, table.clusterId, table.parentId, table.orderIndex),
}));

// Criteria Formula - Chi tiết cho tiêu chí định lượng
export const criteriaFormula = pgTable("criteria_formula", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }).unique(),
  targetRequired: integer("target_required").notNull().default(1), // 1=bắt buộc giao chỉ tiêu, 0=không
  defaultTarget: decimal("default_target", { precision: 10, scale: 2 }),
  unit: text("unit"), // đơn vị tính (%, vụ, lần, người...)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Criteria Fixed Score - Chi tiết cho tiêu chí chấm thẳng
export const criteriaFixedScore = pgTable("criteria_fixed_score", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }).unique(),
  pointPerUnit: decimal("point_per_unit", { precision: 7, scale: 2 }).notNull(), // điểm/lần
  maxScoreLimit: decimal("max_score_limit", { precision: 7, scale: 2 }), // giới hạn điểm tối đa (optional)
  unit: text("unit"), // đơn vị (lần, người, ...)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Criteria Bonus Penalty - Chi tiết cho tiêu chí +/-
export const criteriaBonusPenalty = pgTable("criteria_bonus_penalty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }).unique(),
  bonusPoint: decimal("bonus_point", { precision: 7, scale: 2 }), // điểm cộng/lần
  penaltyPoint: decimal("penalty_point", { precision: 7, scale: 2 }), // điểm trừ/lần
  minScore: decimal("min_score", { precision: 7, scale: 2 }), // điểm tối thiểu
  maxScore: decimal("max_score", { precision: 7, scale: 2 }), // điểm tối đa
  unit: text("unit"), // đơn vị
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Criteria Targets - Giao chỉ tiêu cho từng đơn vị
export const criteriaTargets = pgTable("criteria_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  periodId: varchar("period_id").notNull().references(() => evaluationPeriods.id, { onDelete: "cascade" }),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTargetPerUnit: unique().on(table.criteriaId, table.unitId, table.periodId),
}));

// Criteria Results - Lưu kết quả chấm điểm
export const criteriaResults = pgTable("criteria_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  periodId: varchar("period_id").notNull().references(() => evaluationPeriods.id, { onDelete: "cascade" }),
  
  // Dữ liệu nhập vào
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }), // Giá trị thực tế (cho định lượng)
  selfScore: decimal("self_score", { precision: 7, scale: 2 }), // Điểm tự chấm (cho định tính, chấm thẳng, +/-)
  bonusCount: integer("bonus_count").default(0), // Số lần cộng (cho +/-)
  penaltyCount: integer("penalty_count").default(0), // Số lần trừ (cho +/-)
  
  // Điểm được tính
  calculatedScore: decimal("calculated_score", { precision: 7, scale: 2 }), // Điểm hệ thống tính
  clusterScore: decimal("cluster_score", { precision: 7, scale: 2 }), // Điểm cụm chấm
  finalScore: decimal("final_score", { precision: 7, scale: 2 }), // Điểm cuối cùng
  
  note: text("note"),
  evidenceFile: text("evidence_file"), // File minh chứng
  
  status: text("status").notNull().default("draft"), // draft, submitted, reviewed, finalized
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueResultPerUnit: unique().on(table.criteriaId, table.unitId, table.periodId),
}));

// Insert schemas for new tables
export const insertCriteriaSchema = createInsertSchema(criteria).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCriteriaFormulaSchema = createInsertSchema(criteriaFormula).omit({
  id: true,
  createdAt: true,
});

export const insertCriteriaFixedScoreSchema = createInsertSchema(criteriaFixedScore).omit({
  id: true,
  createdAt: true,
});

export const insertCriteriaBonusPenaltySchema = createInsertSchema(criteriaBonusPenalty).omit({
  id: true,
  createdAt: true,
});

export const insertCriteriaTargetSchema = createInsertSchema(criteriaTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCriteriaResultSchema = createInsertSchema(criteriaResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertCriteria = z.infer<typeof insertCriteriaSchema>;
export type Criteria = typeof criteria.$inferSelect;
export type CriteriaWithChildren = Criteria & { children?: CriteriaWithChildren[] };

export type InsertCriteriaFormula = z.infer<typeof insertCriteriaFormulaSchema>;
export type CriteriaFormula = typeof criteriaFormula.$inferSelect;

export type InsertCriteriaFixedScore = z.infer<typeof insertCriteriaFixedScoreSchema>;
export type CriteriaFixedScore = typeof criteriaFixedScore.$inferSelect;

export type InsertCriteriaBonusPenalty = z.infer<typeof insertCriteriaBonusPenaltySchema>;
export type CriteriaBonusPenalty = typeof criteriaBonusPenalty.$inferSelect;

export type InsertCriteriaTarget = z.infer<typeof insertCriteriaTargetSchema>;
export type CriteriaTarget = typeof criteriaTargets.$inferSelect;

export type InsertCriteriaResult = z.infer<typeof insertCriteriaResultSchema>;
export type CriteriaResult = typeof criteriaResults.$inferSelect;

// Evaluation Periods (Kỳ thi đua) - Cấp tỉnh, áp dụng cho nhiều cụm
export const evaluationPeriods = pgTable("evaluation_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, review1, review2, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Evaluation Period Clusters (Bảng trung gian: 1 kỳ thi đua → nhiều cụm)
export const evaluationPeriodClusters = pgTable("evaluation_period_clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => evaluationPeriods.id, { onDelete: "cascade" }),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqPeriodCluster: unique().on(table.periodId, table.clusterId),
}));

export const insertEvaluationPeriodSchema = createInsertSchema(evaluationPeriods, {
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertEvaluationPeriod = z.infer<typeof insertEvaluationPeriodSchema>;
export type EvaluationPeriod = typeof evaluationPeriods.$inferSelect;

export const insertEvaluationPeriodClusterSchema = createInsertSchema(evaluationPeriodClusters).omit({
  id: true,
  createdAt: true,
});

export type InsertEvaluationPeriodCluster = z.infer<typeof insertEvaluationPeriodClusterSchema>;
export type EvaluationPeriodCluster = typeof evaluationPeriodClusters.$inferSelect;

// Evaluations (Đánh giá cho từng đơn vị trong kỳ)
export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => evaluationPeriods.id, { onDelete: "cascade" }),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
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

// Scores (Điểm cho từng tiêu chí - multi-stage workflow) - LEGACY TABLE, sẽ được thay thế bởi criteriaResults
export const scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evaluationId: varchar("evaluation_id").notNull().references(() => evaluations.id, { onDelete: "cascade" }),
  criteriaId: varchar("criteria_id").notNull().references(() => criteria.id, { onDelete: "cascade" }),
  
  // Input fields for different criteria types
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }), // Type 1 (Quantitative): số liệu thực hiện
  count: integer("count"), // Type 3 (Fixed): số lần đạt
  bonusCount: integer("bonus_count").default(0), // Type 4 (+/-): số lần cộng
  penaltyCount: integer("penalty_count").default(0), // Type 4 (+/-): số lần trừ
  isAchieved: integer("is_achieved"), // Type 2 (Qualitative): 1=đạt, 0=không đạt
  calculatedScore: decimal("calculated_score", { precision: 7, scale: 2 }), // Điểm tự động tính
  
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
  explanationFile: text("explanation_file"),
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
