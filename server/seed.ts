import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  try {
    // Create clusters
    console.log("Tạo Cụm thi đua...");
    const [cluster1, cluster2] = await db.insert(schema.clusters).values([
      {
        name: "Cụm Công an thành phố",
        description: "Cụm thi đua các đơn vị Công an cấp thành phố",
      },
      {
        name: "Cụm Công an huyện",
        description: "Cụm thi đua các đơn vị Công an cấp huyện",
      },
    ]).returning();

    console.log(`✓ Đã tạo ${2} cụm thi đua`);

    // Create units
    console.log("Tạo Đơn vị...");
    const units = await db.insert(schema.units).values([
      {
        name: "Công an Quận 1",
        clusterId: cluster1.id,
        description: "Công an Quận 1, TP.HCM",
      },
      {
        name: "Công an Quận 3",
        clusterId: cluster1.id,
        description: "Công an Quận 3, TP.HCM",
      },
      {
        name: "Công an Quận 5",
        clusterId: cluster1.id,
        description: "Công an Quận 5, TP.HCM",
      },
      {
        name: "Công an Huyện Củ Chi",
        clusterId: cluster2.id,
        description: "Công an Huyện Củ Chi, TP.HCM",
      },
      {
        name: "Công an Huyện Hóc Môn",
        clusterId: cluster2.id,
        description: "Công an Huyện Hóc Môn, TP.HCM",
      },
    ]).returning();

    console.log(`✓ Đã tạo ${units.length} đơn vị`);

    // Create users
    console.log("Tạo người dùng...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const [admin, clusterLeader1, clusterLeader2, user1, user2] = await db.insert(schema.users).values([
      {
        username: "admin",
        password: hashedPassword,
        fullName: "Quản trị viên hệ thống",
        role: "admin",
      },
      {
        username: "cumtruong1",
        password: await bcrypt.hash("123456", 10),
        fullName: "Cụm trưởng Cụm TP",
        role: "cluster_leader",
        clusterId: cluster1.id,
      },
      {
        username: "cumtruong2",
        password: await bcrypt.hash("123456", 10),
        fullName: "Cụm trưởng Cụm Huyện",
        role: "cluster_leader",
        clusterId: cluster2.id,
      },
      {
        username: "donvi1",
        password: await bcrypt.hash("123456", 10),
        fullName: "Cán bộ Công an Quận 1",
        role: "user",
        clusterId: cluster1.id,
        unitId: units[0].id,
      },
      {
        username: "donvi2",
        password: await bcrypt.hash("123456", 10),
        fullName: "Cán bộ Công an Quận 3",
        role: "user",
        clusterId: cluster1.id,
        unitId: units[1].id,
      },
    ]).returning();

    console.log(`✓ Đã tạo ${5} người dùng`);

    // Create criteria groups for 2025
    console.log("Tạo Nhóm tiêu chí...");
    const [group1, group2, group3] = await db.insert(schema.criteriaGroups).values([
      {
        name: "I. CÔNG TÁC XÂY DỰNG ĐẢNG, XÂY DỰNG LỰC LƯỢNG",
        displayOrder: 1,
        year: 2025,
        clusterId: cluster1.id,
      },
      {
        name: "II. CÔNG TÁC ĐẢM BẢO AN NINH QUỐC GIA",
        displayOrder: 2,
        year: 2025,
        clusterId: cluster1.id,
      },
      {
        name: "III. CÔNG TÁC BẢO ĐẢM TRẬT TỰ AN TOÀN XÃ HỘI",
        displayOrder: 3,
        year: 2025,
        clusterId: cluster1.id,
      },
    ]).returning();

    console.log(`✓ Đã tạo ${3} nhóm tiêu chí`);

    // Create criteria
    console.log("Tạo Tiêu chí...");
    const criteria = await db.insert(schema.criteria).values([
      // Group 1 criteria
      {
        name: "Công tác tổ chức, cán bộ",
        groupId: group1.id,
        maxScore: "10.00",
        displayOrder: 1,
      },
      {
        name: "Công tác giáo dục chính trị, tư tưởng",
        groupId: group1.id,
        maxScore: "8.00",
        displayOrder: 2,
      },
      {
        name: "Công tác xây dựng lực lượng",
        groupId: group1.id,
        maxScore: "12.00",
        displayOrder: 3,
      },
      // Group 2 criteria
      {
        name: "Công tác bảo vệ chính trị nội bộ",
        groupId: group2.id,
        maxScore: "15.00",
        displayOrder: 1,
      },
      {
        name: "Công tác điều tra, phòng chống tội phạm an ninh",
        groupId: group2.id,
        maxScore: "20.00",
        displayOrder: 2,
      },
      // Group 3 criteria
      {
        name: "Công tác đấu tranh phòng chống tội phạm hình sự",
        groupId: group3.id,
        maxScore: "25.00",
        displayOrder: 1,
      },
      {
        name: "Công tác quản lý hành chính về trật tự xã hội",
        groupId: group3.id,
        maxScore: "20.00",
        displayOrder: 2,
      },
      {
        name: "Công tác phòng cháy, chữa cháy",
        groupId: group3.id,
        maxScore: "15.00",
        displayOrder: 3,
      },
    ]).returning();

    console.log(`✓ Đã tạo ${criteria.length} tiêu chí`);

    // Create evaluation period
    console.log("Tạo Kỳ thi đua...");
    const [period] = await db.insert(schema.evaluationPeriods).values([
      {
        name: "Kỳ thi đua 6 tháng đầu năm 2025",
        year: 2025,
        clusterId: cluster1.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
        status: "active",
      },
    ]).returning();

    console.log(`✓ Đã tạo kỳ thi đua`);

    // Create evaluations for units
    console.log("Tạo Đánh giá cho các đơn vị...");
    const evaluations = await db.insert(schema.evaluations).values([
      {
        periodId: period.id,
        unitId: units[0].id,
        status: "draft",
      },
      {
        periodId: period.id,
        unitId: units[1].id,
        status: "draft",
      },
      {
        periodId: period.id,
        unitId: units[2].id,
        status: "draft",
      },
    ]).returning();

    console.log(`✓ Đã tạo ${evaluations.length} đánh giá`);

    // Create empty scores for each evaluation and criteria
    console.log("Tạo bảng điểm rỗng...");
    const scores = [];
    for (const evaluation of evaluations) {
      for (const criterion of criteria) {
        scores.push({
          evaluationId: evaluation.id,
          criteriaId: criterion.id,
        });
      }
    }
    await db.insert(schema.scores).values(scores);

    console.log(`✓ Đã tạo ${scores.length} bản ghi điểm`);

    console.log("\n✅ Hoàn thành seed dữ liệu!");
    console.log("\n📋 Thông tin đăng nhập:");
    console.log("  Admin: admin / admin123");
    console.log("  Cụm trưởng 1: cumtruong1 / 123456");
    console.log("  Cụm trưởng 2: cumtruong2 / 123456");
    console.log("  Đơn vị 1: donvi1 / 123456");
    console.log("  Đơn vị 2: donvi2 / 123456");
    
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("\n🎉 Seed thành công!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed thất bại:", error);
    process.exit(1);
  });
