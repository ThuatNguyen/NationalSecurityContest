/**
 * Script seed dữ liệu demo cho Kỳ thi đua
 * Tạo:
 * - 1 Evaluation Period cho năm 2025
 * - Cây tiêu chí với 4 loại tiêu chí (định lượng, định tính, chấm thẳng, +/-)
 * - Giao chỉ tiêu cho các đơn vị
 */

import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedEvaluationDemo() {
  console.log("🌱 Starting evaluation demo seed...");

  try {
    // 1. Lấy cluster và units đầu tiên
    const clusters = await db.select().from(schema.clusters).limit(1);
    if (clusters.length === 0) {
      throw new Error("No clusters found. Please run main seed first.");
    }
    const cluster = clusters[0];
    console.log(`✅ Using cluster: ${cluster.name}`);

    const units = await db.select().from(schema.units).where(eq(schema.units.clusterId, cluster.id)).limit(3);
    if (units.length === 0) {
      throw new Error("No units found in cluster. Please run main seed first.");
    }
    console.log(`✅ Found ${units.length} units`);

    // 2. Tạo Evaluation Period cho năm 2025
    const existingPeriods = await db.select().from(schema.evaluationPeriods)
      .where(eq(schema.evaluationPeriods.year, 2025))
      .limit(1);

    let period;
    if (existingPeriods.length > 0) {
      period = existingPeriods[0];
      console.log(`✅ Using existing period: ${period.name}`);
    } else {
      const [newPeriod] = await db.insert(schema.evaluationPeriods).values({
        name: "Kỳ thi đua năm 2025",
        year: 2025,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        status: "active",
      }).returning();
      period = newPeriod;
      console.log(`✅ Created evaluation period: ${period.name}`);
      
      // Gán period cho cluster qua bảng junction
      await db.insert(schema.evaluationPeriodClusters).values({
        periodId: period.id,
        clusterId: cluster.id,
      });
      console.log(`✅ Assigned period to cluster: ${cluster.name}`);
    }

    // 3. Xóa tiêu chí cũ nếu có (để tạo lại từ đầu)
    await db.delete(schema.criteria).where(eq(schema.criteria.year, 2025));
    console.log("🗑️  Cleared old criteria for 2025");

    // 4. Tạo cây tiêu chí với 4 loại
    console.log("📝 Creating criteria tree...");

    // NHÓM 1: KẾT QUẢ CÔNG TÁC CHUYÊN MÔN
    const [group1] = await db.insert(schema.criteria).values({
      parentId: null,
      level: 1,
      name: "I. KẾT QUẢ CÔNG TÁC CHUYÊN MÔN",
      code: "I",
      maxScore: "50",
      criteriaType: 0, // Parent node
      orderIndex: 1,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    // 1.1 Tiêu chí ĐỊNH LƯỢNG - công thức 1 (không đạt)
    const [c1_1] = await db.insert(schema.criteria).values({
      parentId: group1.id,
      level: 2,
      name: "Tỷ lệ giải quyết hồ sơ đúng hạn",
      code: "1.1",
      maxScore: "15",
      criteriaType: 1, // Định lượng
      formulaType: 1, // Không đạt chỉ tiêu
      orderIndex: 1,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    await db.insert(schema.criteriaFormula).values({
      criteriaId: c1_1.id,
      targetRequired: 1,
      defaultTarget: "100",
      unit: "%",
    });

    // 1.2 Tiêu chí ĐỊNH LƯỢNG - công thức 2 (đạt đủ)
    const [c1_2] = await db.insert(schema.criteria).values({
      parentId: group1.id,
      level: 2,
      name: "Số lượng vụ án đã giải quyết",
      code: "1.2",
      maxScore: "20",
      criteriaType: 1, // Định lượng
      formulaType: 2, // Đạt đủ chỉ tiêu
      orderIndex: 2,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    await db.insert(schema.criteriaFormula).values({
      criteriaId: c1_2.id,
      targetRequired: 1,
      defaultTarget: "50",
      unit: "vụ",
    });

    // 1.3 Tiêu chí ĐỊNH TÍNH
    const [c1_3] = await db.insert(schema.criteria).values({
      parentId: group1.id,
      level: 2,
      name: "Hoàn thành tốt công tác báo cáo định kỳ",
      code: "1.3",
      maxScore: "15",
      criteriaType: 2, // Định tính (đạt/không đạt)
      orderIndex: 3,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    console.log("✅ Created Group 1 with 3 criteria");

    // NHÓM 2: CÔNG TÁC QUẢN LÝ VÀ ĐÀO TẠO
    const [group2] = await db.insert(schema.criteria).values({
      parentId: null,
      level: 1,
      name: "II. CÔNG TÁC QUẢN LÝ VÀ ĐÀO TẠO",
      code: "II",
      maxScore: "30",
      criteriaType: 0, // Parent node
      orderIndex: 2,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    // 2.1 Tiêu chí CHẤM THẲNG
    const [c2_1] = await db.insert(schema.criteria).values({
      parentId: group2.id,
      level: 2,
      name: "Tổ chức các buổi tập huấn, đào tạo nghiệp vụ",
      code: "2.1",
      maxScore: "20",
      criteriaType: 3, // Chấm thẳng
      orderIndex: 1,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    await db.insert(schema.criteriaFixedScore).values({
      criteriaId: c2_1.id,
      pointPerUnit: "5",
      maxScoreLimit: "20",
      unit: "buổi",
    });

    // 2.2 Tiêu chí ĐỊNH TÍNH
    const [c2_2] = await db.insert(schema.criteria).values({
      parentId: group2.id,
      level: 2,
      name: "Xây dựng kế hoạch công tác năm đúng hạn",
      code: "2.2",
      maxScore: "10",
      criteriaType: 2, // Định tính
      orderIndex: 2,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    console.log("✅ Created Group 2 with 2 criteria");

    // NHÓM 3: THƯỞNG VÀ KỶ LUẬT
    const [group3] = await db.insert(schema.criteria).values({
      parentId: null,
      level: 1,
      name: "III. ĐIỂM THƯỞNG VÀ TRỪ",
      code: "III",
      maxScore: "20",
      criteriaType: 0, // Parent node
      orderIndex: 3,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    // 3.1 Tiêu chí CỘNG/TRỪ điểm
    const [c3_1] = await db.insert(schema.criteria).values({
      parentId: group3.id,
      level: 2,
      name: "Điểm cộng/trừ dựa trên khen thưởng và vi phạm",
      code: "3.1",
      maxScore: "20",
      criteriaType: 4, // Cộng/Trừ
      orderIndex: 1,
      year: 2025,
      clusterId: cluster.id,
    }).returning();

    await db.insert(schema.criteriaBonusPenalty).values({
      criteriaId: c3_1.id,
      bonusPoint: "5",
      penaltyPoint: "3",
      minScore: "-10",
      maxScore: "20",
      unit: "lần",
    });

    console.log("✅ Created Group 3 with 1 criteria");

    // 5. Giao chỉ tiêu cho các đơn vị (chỉ cho tiêu chí định lượng)
    console.log("📊 Assigning targets to units...");
    
    const quantitativeCriteria = [c1_1, c1_2];
    for (const unit of units) {
      for (const criteria of quantitativeCriteria) {
        await db.insert(schema.criteriaTargets).values({
          criteriaId: criteria.id,
          unitId: unit.id,
          year: 2025,
          targetValue: criteria.id === c1_1.id ? "95" : "45", // Chỉ tiêu khác nhau
          note: `Chỉ tiêu năm 2025 cho ${unit.shortName}`,
        }).onConflictDoNothing();
      }
    }

    console.log(`✅ Assigned targets to ${units.length} units`);

    // 6. Tạo evaluations cho các đơn vị
    console.log("📋 Creating evaluations...");
    for (const unit of units) {
      await db.insert(schema.evaluations).values({
        periodId: period.id,
        clusterId: cluster.id, // Lấy từ cluster của đơn vị
        unitId: unit.id,
        status: "draft",
      }).onConflictDoNothing();
    }
    console.log(`✅ Created evaluations for ${units.length} units`);

    console.log("\n✨ Seed completed successfully!");
    console.log("\n📝 Summary:");
    console.log(`   - Period: ${period.name}`);
    console.log(`   - Year: ${period.year}`);
    console.log(`   - Cluster: ${cluster.name}`);
    console.log(`   - Criteria Groups: 3`);
    console.log(`   - Total Criteria: 6 leaf nodes + 3 parent nodes = 9 nodes`);
    console.log(`   - Criteria Types:`);
    console.log(`     • Type 1 (Định lượng): 2 tiêu chí`);
    console.log(`     • Type 2 (Định tính): 2 tiêu chí`);
    console.log(`     • Type 3 (Chấm thẳng): 1 tiêu chí`);
    console.log(`     • Type 4 (Cộng/Trừ): 1 tiêu chí`);
    console.log(`   - Units: ${units.length}`);
    console.log(`   - Evaluations: ${units.length}`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed
seedEvaluationDemo()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
