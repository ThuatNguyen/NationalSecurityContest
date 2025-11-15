# Hướng dẫn chạy migration cập nhật schema Cụm thi đua và Đơn vị

## Tổng quan
Migration này cập nhật bảng `clusters` và `units` với các trường mới:
- **clusters**: Thêm `short_name`, `cluster_type`, `updated_at`
- **units**: Thêm `short_name`, `updated_at`

## Các bước thực hiện

### 1. Backup database trước khi chạy migration
```bash
pg_dump -U postgres -h localhost your_database_name > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Chạy migration SQL

Có 2 cách để chạy migration:

#### Cách 1: Sử dụng psql command line
```bash
psql -U postgres -h localhost -d your_database_name -f migrations/0001_update_clusters_units.sql
```

#### Cách 2: Kết nối trực tiếp qua psql và copy-paste
```bash
psql -U postgres -h localhost -d your_database_name
```

Sau đó copy nội dung file `migrations/0001_update_clusters_units.sql` và paste vào terminal.

### 3. Kiểm tra migration đã chạy thành công

```sql
-- Kiểm tra cấu trúc bảng clusters
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clusters' 
ORDER BY ordinal_position;

-- Kiểm tra cấu trúc bảng units
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'units' 
ORDER BY ordinal_position;

-- Kiểm tra constraint
SELECT con.conname, con.contype 
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname IN ('clusters', 'units');
```

### 4. Cập nhật dữ liệu mẫu (nếu cần)

Nếu bạn có dữ liệu cũ cần cập nhật:

```sql
-- Cập nhật short_name cho clusters (nếu chưa được tự động tạo)
UPDATE clusters 
SET short_name = UPPER(SUBSTRING(name FROM 1 FOR 3))
WHERE short_name IS NULL OR short_name = '';

-- Cập nhật cluster_type cho clusters
UPDATE clusters 
SET cluster_type = 'khac'
WHERE cluster_type IS NULL OR cluster_type = '';

-- Cập nhật short_name cho units
UPDATE units 
SET short_name = UPPER(SUBSTRING(name FROM 1 FOR 3))
WHERE short_name IS NULL OR short_name = '';
```

### 5. Khởi động lại server

```bash
npm run dev
```

## Kiểm tra chức năng

Sau khi chạy migration và khởi động server, hãy kiểm tra:

1. **Tạo cụm thi đua mới**:
   - Truy cập trang "Quản lý Cụm thi đua"
   - Thêm cụm mới với đầy đủ các trường: Tên, Tên viết tắt, Loại cụm, Mô tả
   - Kiểm tra validation: không cho phép trùng tên hoặc tên viết tắt

2. **Tạo đơn vị mới**:
   - Truy cập trang "Quản lý Đơn vị"
   - Thêm đơn vị mới với đầy đủ các trường: Tên, Tên viết tắt, Cụm thi đua, Mô tả
   - Kiểm tra validation: không cho phép trùng tên hoặc tên viết tắt

3. **Xóa có ràng buộc**:
   - Thử xóa cụm thi đua đang có đơn vị → Phải báo lỗi
   - Thử xóa đơn vị đang có user hoặc đánh giá → Phải báo lỗi

4. **Cập nhật**:
   - Sửa thông tin cụm thi đua
   - Sửa thông tin đơn vị
   - Kiểm tra không được trùng tên/tên viết tắt với bản ghi khác

## Rollback (nếu cần)

Nếu cần rollback migration:

```sql
-- Xóa các cột đã thêm
ALTER TABLE clusters DROP COLUMN IF EXISTS short_name;
ALTER TABLE clusters DROP COLUMN IF EXISTS cluster_type;
ALTER TABLE clusters DROP COLUMN IF EXISTS updated_at;

ALTER TABLE units DROP COLUMN IF EXISTS short_name;
ALTER TABLE units DROP COLUMN IF EXISTS updated_at;

-- Xóa constraints
ALTER TABLE clusters DROP CONSTRAINT IF EXISTS clusters_name_unique;
ALTER TABLE clusters DROP CONSTRAINT IF EXISTS clusters_short_name_unique;
ALTER TABLE clusters DROP CONSTRAINT IF EXISTS clusters_cluster_type_check;

ALTER TABLE units DROP CONSTRAINT IF EXISTS units_name_unique;
ALTER TABLE units DROP CONSTRAINT IF EXISTS units_short_name_unique;
```

Hoặc restore từ backup:

```bash
psql -U postgres -h localhost -d your_database_name < backup_before_migration_YYYYMMDD_HHMMSS.sql
```

## Lưu ý quan trọng

1. **ID vẫn là UUID**: Mặc dù yêu cầu ban đầu là chuyển sang integer, nhưng để tương thích với hệ thống hiện tại, ID vẫn giữ nguyên là UUID (varchar).

2. **onDelete RESTRICT**: Khóa ngoại `units.cluster_id` đã được thay đổi từ CASCADE sang RESTRICT để đảm bảo không xóa cụm thi đua khi còn đơn vị trực thuộc.

3. **Validation ở nhiều lớp**:
   - Database: UNIQUE constraints, CHECK constraints
   - Backend: Logic kiểm tra trong storage.ts
   - Frontend: Validation trong form

4. **Default values**: Migration tự động tạo giá trị mặc định cho các bản ghi cũ:
   - `short_name`: Lấy 3 ký tự đầu của tên (uppercase)
   - `cluster_type`: Mặc định là 'khac'
   - `updated_at`: Lấy từ created_at

## Các loại cụm thi đua

- **phong**: Cụm cấp phòng
- **xa_phuong**: Cụm Công an xã/phường/đặc khu
- **khac**: Các cụm khác

## Hỗ trợ

Nếu gặp vấn đề trong quá trình migration, vui lòng:
1. Kiểm tra log lỗi từ PostgreSQL
2. Đảm bảo database đang chạy
3. Kiểm tra quyền user database
4. Xem lại backup để rollback nếu cần
