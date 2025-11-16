import { db } from "./db";
import * as schema from "@shared/schema";

/**
 * Seed tiêu chí dạng cây (3-4 cấp) với 4 loại tiêu chí
 */
async function seedCriteriaTree() {
  console.log("🌱 Bắt đầu seed tiêu chí dạng cây...");
  
  const year = 2025;
  
  // LEVEL 1: Tiêu chí gốc (3 nhóm lớn) - KHÔNG chấm điểm trực tiếp
  const [l1_1] = await db.insert(schema.criteria).values({
    name: "Công tác đảm bảo an ninh quốc gia",
    code: "I",
    maxScore: "40",
    criteriaType: 0, // 0 = Parent node, không chấm điểm trực tiếp
    level: 1,
    orderIndex: 1,
    year: year,
    clusterId: null // Áp dụng cho tất cả các cụm
  }).returning();
  
  const [l1_2] = await db.insert(schema.criteria).values({
    name: "Công tác đảm bảo trật tự an toàn xã hội",
    code: "II",
    maxScore: "40",
    criteriaType: 0, // 0 = Parent node
    level: 1,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  const [l1_3] = await db.insert(schema.criteria).values({
    name: "Công tác xây dựng lực lượng",
    code: "III",
    maxScore: "20",
    criteriaType: 0, // 0 = Parent node
    level: 1,
    orderIndex: 3,
    year: year,
    clusterId: null
  }).returning();
  
  console.log("✓ Đã tạo 3 tiêu chí cấp 1");
  
  // LEVEL 2: Tiêu chí con của I - CŨNG LÀ PARENT (không chấm điểm trực tiếp)
  const [l2_1_1] = await db.insert(schema.criteria).values({
    parentId: l1_1.id,
    name: "Công tác nắm tình hình",
    code: "I.1",
    maxScore: "10",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  const [l2_1_2] = await db.insert(schema.criteria).values({
    parentId: l1_1.id,
    name: "Công tác phòng ngừa, đấu tranh",
    code: "I.2",
    maxScore: "15",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  const [l2_1_3] = await db.insert(schema.criteria).values({
    parentId: l1_1.id,
    name: "Xây dựng phong trào toàn dân bảo vệ ANTQ",
    code: "I.3",
    maxScore: "15",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 3,
    year: year,
    clusterId: null
  }).returning();
  
  // LEVEL 2: Tiêu chí con của II - CŨNG LÀ PARENT
  const [l2_2_1] = await db.insert(schema.criteria).values({
    parentId: l1_2.id,
    name: "Công tác phòng chống tội phạm",
    code: "II.1",
    maxScore: "20",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  const [l2_2_2] = await db.insert(schema.criteria).values({
    parentId: l1_2.id,
    name: "Công tác quản lý hành chính",
    code: "II.2",
    maxScore: "10",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  const [l2_2_3] = await db.insert(schema.criteria).values({
    parentId: l1_2.id,
    name: "Công tác PCCC và CNCH",
    code: "II.3",
    maxScore: "10",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 3,
    year: year,
    clusterId: null
  }).returning();
  
  // LEVEL 2: Tiêu chí con của III - CŨNG LÀ PARENT
  const [l2_3_1] = await db.insert(schema.criteria).values({
    parentId: l1_3.id,
    name: "Đào tạo, bồi dưỡng",
    code: "III.1",
    maxScore: "10",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  const [l2_3_2] = await db.insert(schema.criteria).values({
    parentId: l1_3.id,
    name: "Khen thưởng, kỷ luật",
    code: "III.2",
    maxScore: "10",
    criteriaType: 0, // 0 = Parent node
    level: 2,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  console.log("✓ Đã tạo 8 tiêu chí cấp 2");
  
  // LEVEL 3: Tiêu chí lá - ĐỊNH LƯỢNG (4 công thức)
  // Loại 1: Định lượng - Công thức 1 (Không đạt chỉ tiêu)
  const [l3_1_1_1] = await db.insert(schema.criteria).values({
    parentId: l2_1_1.id,
    name: "Tỷ lệ nắm các vụ việc phức tạp",
    code: "I.1.1",
    maxScore: "5",
    criteriaType: 1,
    formulaType: 1,
    level: 3,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFormula).values({
    criteriaId: l3_1_1_1.id,
    targetRequired: 1,
    defaultTarget: "100",
    unit: "%"
  });
  
  // Loại 1: Định lượng - Công thức 2 (Đạt đủ chỉ tiêu)
  const [l3_1_1_2] = await db.insert(schema.criteria).values({
    parentId: l2_1_1.id,
    name: "Số tin báo được tiếp nhận",
    code: "I.1.2",
    maxScore: "5",
    criteriaType: 1,
    formulaType: 2,
    level: 3,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFormula).values({
    criteriaId: l3_1_1_2.id,
    targetRequired: 1,
    defaultTarget: "50",
    unit: "tin"
  });
  
  // Loại 1: Định lượng - Công thức 3 (Dẫn đầu cụm)
  const [l3_2_1_1] = await db.insert(schema.criteria).values({
    parentId: l2_2_1.id,
    name: "Tỷ lệ điều tra khám phá án hình sự",
    code: "II.1.1",
    maxScore: "10",
    criteriaType: 1,
    formulaType: 3,
    level: 3,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFormula).values({
    criteriaId: l3_2_1_1.id,
    targetRequired: 1,
    defaultTarget: "80",
    unit: "%"
  });
  
  // Loại 1: Định lượng - Công thức 4 (Vượt không dẫn đầu)
  const [l3_2_1_2] = await db.insert(schema.criteria).values({
    parentId: l2_2_1.id,
    name: "Số vụ án ma túy phát hiện",
    code: "II.1.2",
    maxScore: "10",
    criteriaType: 1,
    formulaType: 4,
    level: 3,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFormula).values({
    criteriaId: l3_2_1_2.id,
    targetRequired: 1,
    defaultTarget: "10",
    unit: "vụ"
  });
  
  console.log("✓ Đã tạo 4 tiêu chí định lượng (4 loại công thức)");
  
  // LEVEL 3: Tiêu chí lá - ĐỊNH TÍNH
  const [l3_1_2_1] = await db.insert(schema.criteria).values({
    parentId: l2_1_2.id,
    name: "Có phương án đấu tranh với các thế lực thù địch",
    code: "I.2.1",
    maxScore: "5",
    criteriaType: 2, // Định tính
    level: 3,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  const [l3_1_2_2] = await db.insert(schema.criteria).values({
    parentId: l2_1_2.id,
    name: "Có kế hoạch tuyên truyền phòng chống tội phạm",
    code: "I.2.2",
    maxScore: "5",
    criteriaType: 2,
    level: 3,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  const [l3_1_2_3] = await db.insert(schema.criteria).values({
    parentId: l2_1_2.id,
    name: "Thực hiện đầy đủ các biện pháp nghiệp vụ",
    code: "I.2.3",
    maxScore: "5",
    criteriaType: 2,
    level: 3,
    orderIndex: 3,
    year: year,
    clusterId: null
  }).returning();
  
  console.log("✓ Đã tạo 3 tiêu chí định tính");
  
  // LEVEL 3: Tiêu chí lá - CHẤM THẲNG
  const [l3_3_2_1] = await db.insert(schema.criteria).values({
    parentId: l2_3_2.id,
    name: "Danh hiệu Chiến sĩ thi đua cơ sở",
    code: "III.2.1",
    maxScore: "5",
    criteriaType: 3, // Chấm thẳng
    level: 3,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFixedScore).values({
    criteriaId: l3_3_2_1.id,
    pointPerUnit: "0.5",
    maxScoreLimit: "5",
    unit: "người"
  });
  
  const [l3_3_2_2] = await db.insert(schema.criteria).values({
    parentId: l2_3_2.id,
    name: "Bằng khen của Bộ trưởng",
    code: "III.2.2",
    maxScore: "5",
    criteriaType: 3,
    level: 3,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFixedScore).values({
    criteriaId: l3_3_2_2.id,
    pointPerUnit: "2.5",
    maxScoreLimit: "5",
    unit: "lần"
  });
  
  console.log("✓ Đã tạo 2 tiêu chí chấm thẳng");
  
  // LEVEL 3: Tiêu chí lá - CỘNG/TRỪ ĐIỂM
  const [l3_2_2_1] = await db.insert(schema.criteria).values({
    parentId: l2_2_2.id,
    name: "Cộng/Trừ điểm công tác quản lý hộ khẩu",
    code: "II.2.1",
    maxScore: "10",
    criteriaType: 4, // Cộng/Trừ
    level: 3,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaBonusPenalty).values({
    criteriaId: l3_2_2_1.id,
    bonusPoint: "0.5", // +0.5đ mỗi lần làm tốt
    penaltyPoint: "1.0", // -1.0đ mỗi lần sai sót
    minScore: "-5",
    maxScore: "10",
    unit: "lần"
  });
  
  console.log("✓ Đã tạo 1 tiêu chí cộng/trừ điểm");
  
  // LEVEL 4: Tiêu chí lá sâu hơn (ví dụ)
  const [l4_1_3_1] = await db.insert(schema.criteria).values({
    parentId: l2_1_3.id,
    name: "Số mô hình tự quản về ANTT được xây dựng",
    code: "I.3.1",
    maxScore: "7.5",
    criteriaType: 1,
    formulaType: 2,
    level: 4,
    orderIndex: 1,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFormula).values({
    criteriaId: l4_1_3_1.id,
    targetRequired: 1,
    defaultTarget: "5",
    unit: "mô hình"
  });
  
  const [l4_1_3_2] = await db.insert(schema.criteria).values({
    parentId: l2_1_3.id,
    name: "Tỷ lệ hộ gia đình tham gia phong trào",
    code: "I.3.2",
    maxScore: "7.5",
    criteriaType: 1,
    formulaType: 1,
    level: 4,
    orderIndex: 2,
    year: year,
    clusterId: null
  }).returning();
  
  await db.insert(schema.criteriaFormula).values({
    criteriaId: l4_1_3_2.id,
    targetRequired: 1,
    defaultTarget: "90",
    unit: "%"
  });
  
  console.log("✓ Đã tạo 2 tiêu chí cấp 4");
  
  // Thêm tiêu chí còn lại cho các nhóm khác
  await db.insert(schema.criteria).values([
    {
      parentId: l2_2_3.id,
      name: "Tỷ lệ cơ sở đạt chuẩn PCCC",
      code: "II.3.1",
      maxScore: "5",
      criteriaType: 1,
      formulaType: 1,
      level: 3,
      orderIndex: 1,
      year: year,
      clusterId: null
    },
    {
      parentId: l2_2_3.id,
      name: "Số vụ cháy nổ được xử lý kịp thời",
      code: "II.3.2",
      maxScore: "5",
      criteriaType: 1,
      formulaType: 3,
      level: 3,
      orderIndex: 2,
      year: year,
      clusterId: null
    },
    {
      parentId: l2_3_1.id,
      name: "Số cán bộ được đào tạo nghiệp vụ",
      code: "III.1.1",
      maxScore: "5",
      criteriaType: 1,
      formulaType: 2,
      level: 3,
      orderIndex: 1,
      year: year,
      clusterId: null
    },
    {
      parentId: l2_3_1.id,
      name: "Tỷ lệ hoàn thành chương trình đào tạo",
      code: "III.1.2",
      maxScore: "5",
      criteriaType: 1,
      formulaType: 1,
      level: 3,
      orderIndex: 2,
      year: year,
      clusterId: null
    }
  ]);
  
  console.log("✅ Hoàn thành seed tiêu chí dạng cây!");
  console.log("📊 Tổng cộng:");
  console.log("   - Cấp 1: 3 tiêu chí");
  console.log("   - Cấp 2: 8 tiêu chí");
  console.log("   - Cấp 3: 13 tiêu chí lá");
  console.log("   - Cấp 4: 2 tiêu chí lá");
  console.log("   - Tổng: 26 tiêu chí");
  console.log("");
  console.log("🎯 Phân loại:");
  console.log("   - Định lượng: 10 tiêu chí (4 loại công thức)");
  console.log("   - Định tính: 3 tiêu chí");
  console.log("   - Chấm thẳng: 2 tiêu chí");
  console.log("   - Cộng/Trừ: 1 tiêu chí");
}

// Run seed
seedCriteriaTree()
  .then(() => {
    console.log("\n✅ Seed thành công!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Lỗi seed:", error);
    process.exit(1);
  });
