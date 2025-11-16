# Tài liệu: Hệ thống Chấm điểm Thi đua dạng Cây

## 📋 Tổng quan

Đã xây dựng thành công **hệ thống chấm điểm thi đua dạng cây n cấp** với đầy đủ chức năng:
- ✅ Quản lý cây tiêu chí (tree structure với parent_id)
- ✅ Hỗ trợ 4 loại tiêu chí (định lượng, định tính, chấm thẳng, cộng/trừ)
- ✅ Tính điểm tự động theo công thức Điều 6
- ✅ Giao diện chấm điểm với indent theo level
- ✅ Workflow đánh giá đa giai đoạn (draft → submitted → review1 → review2 → finalized)

---

## 🎯 1. CẤU TRÚC DỮ LIỆU

### 1.1 Bảng `criteria` (Tiêu chí dạng cây)

```sql
CREATE TABLE criteria (
  id VARCHAR PRIMARY KEY,
  parent_id VARCHAR REFERENCES criteria(id),
  level INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  code TEXT,  -- Mã tiêu chí (I, II, 1.1, 1.2.3)
  max_score DECIMAL(7,2) DEFAULT 0,
  criteria_type INTEGER DEFAULT 0,  -- 0=cha, 1=định lượng, 2=định tính, 3=chấm thẳng, 4=+/-
  formula_type INTEGER,  -- Chỉ cho type=1 (1=<100%, 2==100%, 3=dẫn đầu, 4=vượt không dẫn)
  order_index INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  cluster_id VARCHAR REFERENCES clusters(id),  -- NULL = áp dụng tất cả cụm
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Ý nghĩa `criteria_type`:**
- `0` = Tiêu chí cha (không chấm điểm, tổng điểm = tổng điểm con)
- `1` = Định lượng (cần actual_value, target, formula_type)
- `2` = Định tính (checkbox đạt/không đạt)
- `3` = Chấm thẳng (điểm/lần, VD: 5 điểm/buổi tập huấn)
- `4` = Cộng/Trừ (bonus_count, penalty_count)

### 1.2 Bảng `scores` (Điểm chi tiết)

```sql
CREATE TABLE scores (
  id VARCHAR PRIMARY KEY,
  evaluation_id VARCHAR REFERENCES evaluations(id),
  criteria_id VARCHAR REFERENCES criteria(id),
  
  -- Input cho 4 loại tiêu chí
  actual_value DECIMAL(10,2),     -- Type 1: số liệu thực hiện
  count INTEGER,                   -- Type 3: số lần đạt
  is_achieved INTEGER,             -- Type 2: 1=đạt, 0=không
  bonus_count INTEGER DEFAULT 0,   -- Type 4: số lần cộng
  penalty_count INTEGER DEFAULT 0, -- Type 4: số lần trừ
  calculated_score DECIMAL(7,2),   -- Điểm hệ thống tính
  
  -- Workflow chấm điểm đa giai đoạn
  self_score DECIMAL(5,2),
  self_score_file TEXT,
  self_score_date TIMESTAMP,
  
  review1_score DECIMAL(5,2),
  review1_comment TEXT,
  review1_file TEXT,
  review1_date TIMESTAMP,
  review1_by VARCHAR,
  
  explanation TEXT,
  explanation_file TEXT,
  explanation_date TIMESTAMP,
  
  review2_score DECIMAL(5,2),
  review2_comment TEXT,
  review2_file TEXT,
  review2_date TIMESTAMP,
  review2_by VARCHAR,
  
  final_score DECIMAL(5,2),  -- MAX(review1, review2, self)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(evaluation_id, criteria_id)
);
```

---

## 🔧 2. API ENDPOINTS

### 2.1 API Cây tiêu chí

#### `GET /api/criteria/tree`
Lấy cây tiêu chí đầy đủ với children recursive.

**Query params:**
- `year` (required): Năm áp dụng (VD: 2025)
- `clusterId` (optional): Lọc theo cụm

**Response:**
```json
[
  {
    "id": "uuid",
    "parentId": null,
    "level": 1,
    "name": "I. KẾT QUẢ CÔNG TÁC CHUYÊN MÔN",
    "code": "I",
    "maxScore": "50.00",
    "criteriaType": 0,
    "children": [
      {
        "id": "uuid",
        "parentId": "parent-uuid",
        "level": 2,
        "name": "Tỷ lệ giải quyết hồ sơ đúng hạn",
        "code": "1.1",
        "maxScore": "15.00",
        "criteriaType": 1,
        "formulaType": 1,
        "children": []
      }
    ]
  }
]
```

### 2.2 API Evaluation Summary

#### `GET /api/evaluation-periods/:periodId/units/:unitId/summary`
Lấy thông tin kỳ thi đua + cây tiêu chí + điểm đã chấm.

**Response:**
```json
{
  "period": {
    "id": "uuid",
    "name": "Kỳ thi đua 6 tháng đầu năm 2025",
    "year": 2025,
    "clusterId": "uuid",
    "status": "active"
  },
  "evaluation": {
    "id": "uuid",
    "status": "draft",
    "totalSelfScore": null,
    "totalReview1Score": null,
    "totalFinalScore": null
  },
  "criteriaGroups": [
    {
      "id": "uuid",
      "name": "I. KẾT QUẢ CÔNG TÁC CHUYÊN MÔN",
      "displayOrder": 1,
      "criteria": [
        {
          "id": "uuid",
          "name": "I. KẾT QUẢ CÔNG TÁC CHUYÊN MÔN",
          "level": 1,
          "code": "I",
          "maxScore": 50,
          "selfScore": undefined,
          "review1Score": undefined,
          "finalScore": undefined
        },
        {
          "id": "uuid",
          "name": "Tỷ lệ giải quyết hồ sơ đúng hạn",
          "level": 2,
          "code": "1.1",
          "maxScore": 15,
          "selfScore": 12.5,
          "review1Score": 13,
          "finalScore": 13
        }
      ]
    }
  ]
}
```

**Lưu ý:** 
- Cấu trúc `criteriaGroups` là **flat array** theo level 1 nodes
- Mỗi group chứa array `criteria` bao gồm cả node cha và tất cả con cháu (flatten tree)
- UI sẽ dùng `level` để indent display

### 2.3 API Cập nhật điểm

#### `PUT /api/evaluations/:id/scores`
Cập nhật điểm cho nhiều tiêu chí cùng lúc.

**Request body:**
```json
{
  "scores": [
    {
      "criteriaId": "uuid",
      "actualValue": 98.5,        // Cho type 1
      "isAchieved": true,          // Cho type 2
      "count": 4,                  // Cho type 3
      "bonusCount": 2,             // Cho type 4
      "penaltyCount": 1,           // Cho type 4
      "calculatedScore": 14.25,
      "selfScore": 14,
      "selfScoreFile": "/uploads/...",
      "review1Score": 15,
      "review1Comment": "Tốt",
      "review2Score": 14.5
    }
  ]
}
```

---

## 📊 3. LOGIC TÍNH ĐIỂM TỰ ĐỘNG

Được implement trong `server/criteriaScoreService.ts`.

### 3.1 Type 1: Định lượng (Quantitative)

Cần input: `actualValue`, `target`, `formula_type`.

**Formula Type 1: Không đạt chỉ tiêu (<100%)**
```
score = 0.5 × max_score × (actual / target)
```

**Formula Type 2: Đạt đủ chỉ tiêu (=100%)**
```
if (actual / target >= 1.0):
  score = 0.5 × max_score
else:
  score = 0.5 × max_score × (actual / target)
```

**Formula Type 3: Dẫn đầu cụm (vượt và cao nhất)**
```
if (actual > target && is_leader):
  score = max_score
else:
  score = 0.5 × max_score
```

**Formula Type 4: Vượt nhưng không dẫn đầu**
```
if (actual <= target):
  score = 0.5 × max_score × (actual / target)
else if (leader_actual <= target):
  score = 0.5 × max_score
else:
  excess_ratio = (actual - target) / (leader_actual - target)
  score = 0.5 × max_score + excess_ratio × (0.5 × max_score)
  score = min(score, max_score)
```

### 3.2 Type 2: Định tính (Qualitative)

Cần input: `is_achieved` (boolean hoặc checkbox).

```
score = is_achieved ? max_score : 0
```

### 3.3 Type 3: Chấm thẳng (Fixed)

Cần input: `count` (số lần), `point_per_unit`, `max_score_limit`.

```
score = count × point_per_unit
if (max_score_limit && score > max_score_limit):
  score = max_score_limit
```

### 3.4 Type 4: Cộng/Trừ (Bonus/Penalty)

Cần input: `bonus_count`, `penalty_count`, `bonus_point`, `penalty_point`.

```
score = (bonus_count × bonus_point) - (penalty_count × penalty_point)
if (min_score && score < min_score):
  score = min_score
if (max_score && score > max_score):
  score = max_score
```

---

## 🎨 4. GIAO DIỆN NGƯỜI DÙNG

### 4.1 Component `EvaluationPeriods.tsx`

**Bộ lọc (Filter Section):**
1. **Năm thi đua**: Lấy từ `evaluation_periods.year` (distinct), auto-load khi có data
2. **Cụm thi đua**: Lọc theo role (admin xem tất cả, cluster_leader chỉ xem cụm mình)
3. **Đơn vị**: Lọc theo cụm đã chọn

**Bảng tiêu chí:**
- Hiển thị cây dạng flat với indent theo `level`
  - Level 1: không indent, font-weight bold
  - Level 2: indent 32px (8px base + 24px)
  - Level 3: indent 56px (8px base + 48px)
- Tự động group theo level 1 nodes
- Hiển thị tổng điểm cho mỗi group

**Cột bảng:**
| STT | Tên tiêu chí | Điểm tối đa | Điểm tự chấm | File | Review 1 | Giải trình | Review 2 | Điểm cuối |
|-----|-------------|------------|-------------|------|----------|-----------|----------|-----------|

**Tính năng:**
- Click vào "Chấm điểm" → mở `ScoringModal` với input phù hợp theo `criteriaType`
- Click vào "Thẩm định" → mở `ReviewModal` cho cluster_leader/admin
- Nút "Nộp bài" khi status = draft
- Hiển thị badge status

### 4.2 Input theo loại tiêu chí

**Type 1 (Định lượng):**
```tsx
<Input 
  type="number" 
  label="Số liệu thực hiện" 
  value={actualValue}
  onChange={(e) => setActualValue(e.target.value)}
/>
<div>Chỉ tiêu: {target} {unit}</div>
<Button onClick={calculateScore}>Tính điểm</Button>
```

**Type 2 (Định tính):**
```tsx
<Checkbox 
  checked={isAchieved}
  onChange={(checked) => {
    setIsAchieved(checked);
    setSelfScore(checked ? maxScore : 0);
  }}
>
  Đạt tiêu chí
</Checkbox>
```

**Type 3 (Chấm thẳng):**
```tsx
<Input 
  type="number" 
  label={`Số ${unit}`}
  value={count}
  onChange={(e) => {
    const c = parseInt(e.target.value);
    setCount(c);
    setSelfScore(Math.min(c * pointPerUnit, maxScoreLimit));
  }}
/>
<div>Điểm: {count} × {pointPerUnit} = {selfScore}</div>
```

**Type 4 (Cộng/Trừ):**
```tsx
<Input type="number" label="Số lần cộng" value={bonusCount} />
<Input type="number" label="Số lần trừ" value={penaltyCount} />
<Button onClick={() => {
  const score = (bonusCount * bonusPoint) - (penaltyCount * penaltyPoint);
  setSelfScore(clamp(score, minScore, maxScore));
}}>
  Tính điểm
</Button>
```

---

## 🚀 5. HƯỚNG DẪN SỬ DỤNG

### 5.1 Seed dữ liệu mẫu

```bash
cd /home/tnt/PX03/NationalSecurityContest
npx tsx scripts/seed-evaluation-demo.ts
```

**Kết quả:**
- Tạo 1 kỳ thi đua năm 2025
- 3 nhóm tiêu chí (9 nodes tổng cộng)
- 6 tiêu chí lá với đủ 4 loại
- Giao chỉ tiêu cho các đơn vị
- Tạo evaluations (status = draft)

### 5.2 Khởi động server

```bash
npm run dev
```

Server chạy tại: `http://localhost:5000`

### 5.3 Đăng nhập và test

**Admin:**
- Username: `admin`
- Password: `admin123`

**Unit user:**
- Username: `pa05`
- Password: `admin123`

**Các trang quan trọng:**
- `/periods` - Kỳ thi đua (Evaluation Periods)
- `/criteria` - Quản lý tiêu chí (chỉ admin)
- `/users` - Quản lý người dùng

---

## 📁 6. CẤU TRÚC FILE

```
NationalSecurityContest/
├── server/
│   ├── criteriaTreeStorage.ts      # Storage cho cây tiêu chí
│   ├── criteriaTreeRoutes.ts       # Routes API cây tiêu chí
│   ├── criteriaScoreService.ts     # Logic tính điểm 4 loại
│   ├── storage.ts                  # getEvaluationSummaryTree() mới
│   └── routes.ts                   # PUT /api/evaluations/:id/scores cập nhật
├── client/src/pages/
│   ├── EvaluationPeriods.tsx       # Trang chính chấm điểm
│   ├── CriteriaTreeManagement.tsx  # Quản lý cây tiêu chí (admin)
│   └── UsersManagement.tsx         # Quản lý người dùng
├── shared/
│   └── schema.ts                   # Schema Drizzle ORM
├── migrations/
│   └── 0001_add_score_calculation_fields.sql
└── scripts/
    └── seed-evaluation-demo.ts     # Seed dữ liệu demo
```

---

## ✅ 7. CHECKLIST HOÀN THÀNH

- [x] **Cơ sở dữ liệu**
  - [x] Bảng `criteria` với tree structure (parent_id, level)
  - [x] Bảng `scores` với các trường: actual_value, count, is_achieved, bonus_count, penalty_count
  - [x] Bảng `criteria_formula`, `criteria_fixed_score`, `criteria_bonus_penalty`
  - [x] Migration 0001 đã chạy thành công

- [x] **Backend API**
  - [x] `GET /api/criteria/tree` - Cây tiêu chí recursive
  - [x] `GET /api/evaluation-periods/:periodId/units/:unitId/summary` - Summary với cây flat
  - [x] `PUT /api/evaluations/:id/scores` - Cập nhật điểm batch, hỗ trợ 4 loại input
  - [x] `CriteriaScoreService` - 4 hàm tính điểm theo công thức Điều 6

- [x] **Frontend UI**
  - [x] `EvaluationPeriods.tsx` hiển thị cây với indent theo level
  - [x] Bộ lọc năm động (lấy từ evaluation_periods)
  - [x] Workflow chấm điểm: draft → submit → review1 → review2
  - [x] Badge hiển thị status

- [x] **Testing**
  - [x] Script seed demo (`seed-evaluation-demo.ts`)
  - [x] API test thành công với curl
  - [x] Cây tiêu chí hiển thị đúng với 3 level
  - [x] Response format đúng chuẩn

---

## 📌 8. LƯU Ý QUAN TRỌNG

1. **Tính tổng điểm tiêu chí cha:**
   - Tiêu chí có `criteria_type = 0` (parent) KHÔNG được chấm điểm trực tiếp
   - Điểm = tổng điểm các tiêu chí con
   - Phải recursive tính từ lá lên gốc

2. **Xác định đơn vị dẫn đầu (cho formula_type = 4):**
   - Phải query tất cả units trong cùng cluster
   - Tìm unit có `actual_value` cao nhất
   - Chỉ áp dụng nếu leader vượt target

3. **Workflow status:**
   - `draft` → user tự chấm
   - `submitted` → đã nộp, chờ review
   - `review1_completed` → cluster_leader đã thẩm định lần 1
   - `explanation_submitted` → unit giải trình
   - `review2_completed` → admin thẩm định lần 2
   - `finalized` → hoàn tất, lock

4. **File upload:**
   - Lưu vào `/uploads/scores/`
   - Trả về URL: `/uploads/scores/filename.ext`
   - Giới hạn: 10MB
   - Format: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT

---

## 🎉 KẾT LUẬN

Hệ thống đã hoàn thiện với đầy đủ các chức năng theo yêu cầu:
- ✅ Cây tiêu chí n cấp với parent_id
- ✅ 4 loại tiêu chí (định lượng, định tính, chấm thẳng, +/-)
- ✅ Tính điểm tự động theo 4 công thức Điều 6
- ✅ Giao diện chấm điểm với indent, bộ lọc động
- ✅ API RESTful đầy đủ
- ✅ Seed data demo để test

**Sẵn sàng triển khai và sử dụng!** 🚀
