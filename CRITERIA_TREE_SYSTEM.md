# Hệ thống Quản lý Tiêu chí Thi đua (Tree Structure - n cấp)

## 📋 Tổng quan

Hệ thống quản lý tiêu chí thi đua dạng cây không giới hạn cấp độ, hỗ trợ 4 loại tiêu chí với công thức tính điểm tự động.

### ✨ Tính năng chính

- **Tree Structure**: Cấu trúc cây n cấp với parent-child hierarchy
- **4 Loại tiêu chí**:
  - Định lượng (có công thức - 4 loại)
  - Định tính (đạt/không đạt)
  - Chấm thẳng (điểm/lần)
  - Cộng/Trừ điểm
- **Tính điểm tự động**: Hệ thống tự động tính điểm theo công thức
- **Giao chỉ tiêu**: Giao chỉ tiêu riêng cho từng đơn vị
- **Quản lý kết quả**: Lưu trữ và tổng hợp kết quả chấm điểm

---

## 🗄️ Cấu trúc Database

### 1. Bảng `criteria` (Tiêu chí dạng cây)

```sql
CREATE TABLE criteria (
    id VARCHAR PRIMARY KEY,
    parent_id VARCHAR REFERENCES criteria(id),  -- Self-reference cho tree
    level INTEGER NOT NULL,                      -- Cấp độ (1, 2, 3, 4...)
    name TEXT NOT NULL,                          -- Tên tiêu chí
    code TEXT,                                   -- Mã (I, II, 1.1, 1.2.3...)
    description TEXT,
    max_score NUMERIC(7,2),
    
    criteria_type INTEGER NOT NULL,              -- 1=định lượng, 2=định tính, 3=chấm thẳng, 4=+/-
    formula_type INTEGER,                        -- Cho định lượng: 1-4
    
    order_index INTEGER,
    year INTEGER NOT NULL,
    cluster_type TEXT,                           -- null = áp dụng tất cả
    is_active INTEGER DEFAULT 1
);
```

### 2. Bảng `criteria_formula` (Chi tiết định lượng)

```sql
CREATE TABLE criteria_formula (
    id VARCHAR PRIMARY KEY,
    criteria_id VARCHAR UNIQUE REFERENCES criteria(id),
    target_required INTEGER DEFAULT 1,           -- Bắt buộc giao chỉ tiêu?
    default_target NUMERIC(10,2),
    unit TEXT                                    -- %, vụ, lần...
);
```

### 3. Bảng `criteria_fixed_score` (Chi tiết chấm thẳng)

```sql
CREATE TABLE criteria_fixed_score (
    id VARCHAR PRIMARY KEY,
    criteria_id VARCHAR UNIQUE REFERENCES criteria(id),
    point_per_unit NUMERIC(7,2) NOT NULL,       -- Điểm/lần
    max_score_limit NUMERIC(7,2),               -- Giới hạn tối đa
    unit TEXT
);
```

### 4. Bảng `criteria_bonus_penalty` (Chi tiết cộng/trừ)

```sql
CREATE TABLE criteria_bonus_penalty (
    id VARCHAR PRIMARY KEY,
    criteria_id VARCHAR UNIQUE REFERENCES criteria(id),
    bonus_point NUMERIC(7,2),                   -- Điểm cộng/lần
    penalty_point NUMERIC(7,2),                 -- Điểm trừ/lần
    min_score NUMERIC(7,2),
    max_score NUMERIC(7,2),
    unit TEXT
);
```

### 5. Bảng `criteria_targets` (Giao chỉ tiêu)

```sql
CREATE TABLE criteria_targets (
    id VARCHAR PRIMARY KEY,
    criteria_id VARCHAR REFERENCES criteria(id),
    unit_id VARCHAR REFERENCES units(id),
    year INTEGER NOT NULL,
    target_value NUMERIC(10,2) NOT NULL,
    UNIQUE(criteria_id, unit_id, year)
);
```

### 6. Bảng `criteria_results` (Kết quả chấm điểm)

```sql
CREATE TABLE criteria_results (
    id VARCHAR PRIMARY KEY,
    criteria_id VARCHAR REFERENCES criteria(id),
    unit_id VARCHAR REFERENCES units(id),
    year INTEGER NOT NULL,
    
    actual_value NUMERIC(10,2),                 -- Giá trị thực tế
    self_score NUMERIC(7,2),                    -- Điểm tự chấm
    bonus_count INTEGER,                        -- Số lần cộng
    penalty_count INTEGER,                      -- Số lần trừ
    
    calculated_score NUMERIC(7,2),              -- Điểm hệ thống tính
    cluster_score NUMERIC(7,2),                 -- Điểm cụm chấm
    final_score NUMERIC(7,2),                   -- Điểm cuối cùng
    
    status TEXT DEFAULT 'draft',
    UNIQUE(criteria_id, unit_id, year)
);
```

---

## 🧮 Công thức tính điểm

### Loại 1: Định lượng (criteria_type = 1)

#### Formula Type 1: Không đạt chỉ tiêu
```javascript
score = 0.5 × max_score × (actual / target)
```

#### Formula Type 2: Đạt đủ chỉ tiêu
```javascript
if (actual >= target) {
  score = 0.5 × max_score
} else {
  score = 0.5 × max_score × (actual / target)
}
```

#### Formula Type 3: Dẫn đầu cụm
```javascript
if (actual > target && actual === max_in_cluster) {
  score = max_score
} else if (actual >= target) {
  score = 0.5 × max_score
} else {
  score = 0.5 × max_score × (actual / target)
}
```

#### Formula Type 4: Vượt nhưng không dẫn đầu
```javascript
if (actual <= target) {
  score = 0.5 × max_score × (actual / target)
} else {
  const excess_ratio = (actual - target) / (leader_actual - target)
  score = 0.5 × max_score + excess_ratio × (0.5 × max_score)
}
```

### Loại 2: Định tính (criteria_type = 2)

```javascript
score = isAchieved ? max_score : 0
```

### Loại 3: Chấm thẳng (criteria_type = 3)

```javascript
score = count × point_per_unit
if (max_score_limit && score > max_score_limit) {
  score = max_score_limit
}
```

### Loại 4: Cộng/Trừ (criteria_type = 4)

```javascript
score = (bonus_count × bonus_point) - (penalty_count × penalty_point)
score = Math.max(min_score, Math.min(score, max_score))
```

---

## 🔌 API Endpoints

### Quản lý Tiêu chí

#### `GET /api/criteria/tree`
Lấy cây tiêu chí đầy đủ
```bash
GET /api/criteria/tree?year=2025&clusterType=phong
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "Công tác ANQG",
    "code": "I",
    "level": 1,
    "maxScore": "40",
    "criteriaType": 1,
    "children": [
      {
        "id": "uuid2",
        "parentId": "uuid",
        "name": "Nắm tình hình",
        "code": "I.1",
        "level": 2,
        "children": []
      }
    ]
  }
]
```

#### `POST /api/criteria`
Tạo tiêu chí mới (Admin only)
```json
{
  "criteria": {
    "name": "Tỷ lệ điều tra khám phá án",
    "code": "II.1.1",
    "parentId": "parent-uuid",
    "level": 3,
    "maxScore": "10",
    "criteriaType": 1,
    "formulaType": 3,
    "year": 2025
  },
  "details": {
    "formula": {
      "targetRequired": 1,
      "defaultTarget": "80",
      "unit": "%"
    }
  }
}
```

#### `PUT /api/criteria/:id`
Cập nhật tiêu chí

#### `DELETE /api/criteria/:id`
Xóa tiêu chí (chỉ nếu không có con)

### Giao chỉ tiêu

#### `POST /api/criteria-targets`
Giao chỉ tiêu cho đơn vị
```json
{
  "criteriaId": "uuid",
  "unitId": "unit-uuid",
  "year": 2025,
  "targetValue": "100",
  "note": "Chỉ tiêu quý 1"
}
```

#### `GET /api/criteria-targets?unitId=xxx&year=2025`
Lấy chỉ tiêu của đơn vị

### Chấm điểm

#### `POST /api/criteria-results/input`
Nhập kết quả chấm điểm
```json
{
  "criteriaId": "uuid",
  "unitId": "unit-uuid",
  "year": 2025,
  "actualValue": "95",  // Cho định lượng
  "selfScore": "10",     // Cho định tính
  "bonusCount": 2,       // Cho +/-
  "penaltyCount": 1,
  "note": "Ghi chú"
}
```

#### `POST /api/criteria-results/calc`
Tính điểm tự động
```json
{
  "criteriaId": "uuid",
  "unitId": "unit-uuid",
  "year": 2025
}
```

Response:
```json
{
  "score": 8.5
}
```

#### `GET /api/criteria-results/summary?unitId=xxx&year=2025`
Tổng hợp điểm
```json
{
  "total": 85.5,
  "byType": {
    "1": 50.5,
    "2": 20,
    "3": 10,
    "4": 5
  },
  "details": [
    {
      "criteriaId": "uuid",
      "criteriaName": "Tỷ lệ ĐTKHPA",
      "score": 10
    }
  ]
}
```

---

## 💻 Sử dụng

### 1. Chạy Migration

```bash
# Push schema changes
npx drizzle-kit push

# Hoặc chạy migration SQL trực tiếp
psql -U postgres -d contestdb -f migrations/0002_criteria_tree_system.sql
```

### 2. Seed dữ liệu mẫu

```bash
npm run db:seed:criteria
```

Seed sẽ tạo:
- 3 tiêu chí cấp 1
- 8 tiêu chí cấp 2
- 13 tiêu chí cấp 3 (lá)
- 2 tiêu chí cấp 4 (lá)
- **Tổng: 26 tiêu chí** với đủ 4 loại

### 3. Khởi động server

```bash
npm run dev
```

### 4. Truy cập UI

- **Admin**: Quản lý tiêu chí tại `/criteria-tree-management`
- **Đơn vị**: Chấm điểm tại `/criteria-scoring`

---

## 🎯 Ví dụ sử dụng

### Ví dụ 1: Tạo tiêu chí định lượng dẫn đầu cụm

```typescript
const criteria = {
  name: "Tỷ lệ điều tra khám phá án",
  code: "II.1.1",
  parentId: "parent-uuid",
  level: 3,
  maxScore: "10",
  criteriaType: 1,        // Định lượng
  formulaType: 3,         // Dẫn đầu cụm
  year: 2025
};

const details = {
  formula: {
    targetRequired: 1,
    defaultTarget: "80",
    unit: "%"
  }
};
```

### Ví dụ 2: Chấm điểm định lượng

```typescript
// 1. Nhập kết quả
await apiRequest("POST", "/api/criteria-results/input", {
  criteriaId: "criteria-uuid",
  unitId: "unit-uuid",
  year: 2025,
  actualValue: "95"  // Đạt 95%
});

// 2. Tính điểm tự động
const { score } = await apiRequest("POST", "/api/criteria-results/calc", {
  criteriaId: "criteria-uuid",
  unitId: "unit-uuid",
  year: 2025
});

// Nếu target = 80, actual = 95, formula_type = 3 (dẫn đầu)
// → score = 10 (maxScore) nếu là đơn vị cao nhất trong cụm
```

### Ví dụ 3: Tổng hợp điểm toàn đơn vị

```typescript
const summary = await apiRequest("GET", "/api/criteria-results/summary", {
  unitId: "unit-uuid",
  year: 2025
});

// Response:
// {
//   total: 85.5,          // Tổng điểm các tiêu chí lá
//   byType: {
//     1: 50.5,            // Điểm định lượng
//     2: 20,              // Điểm định tính
//     3: 10,              // Điểm chấm thẳng
//     4: 5                // Điểm +/-
//   },
//   details: [...]
// }
```

---

## 🧪 Test Cases

### Test tính điểm định lượng

```typescript
import { CriteriaScoreService } from './criteriaScoreService';

// Formula Type 1: Không đạt chỉ tiêu
const score1 = CriteriaScoreService.calculateQuantitativeScore(
  80,    // actual
  100,   // target
  10,    // maxScore
  1      // formulaType
);
// Expected: 4.0 (= 0.5 × 10 × 0.8)

// Formula Type 3: Dẫn đầu cụm
const score3 = CriteriaScoreService.calculateQuantitativeScore(
  120,   // actual
  100,   // target
  10,    // maxScore
  3      // formulaType
);
// Expected: 10.0 (maxScore)
```

---

## 📚 Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + TypeScript + TanStack Query
- **UI**: Shadcn/UI + Tailwind CSS

---

## 🤝 Hỗ trợ

Để được hỗ trợ, vui lòng:
1. Kiểm tra API documentation
2. Xem ví dụ trong seed data
3. Tham khảo logic tính điểm trong `CriteriaScoreService`

---

## 📝 License

© 2025 Công an nhân dân
