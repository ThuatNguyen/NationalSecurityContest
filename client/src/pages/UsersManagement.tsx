import ManagementTable from "@/components/ManagementTable";
import RoleBadge from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";

export default function UsersManagement() {
  const mockUsers = [
    { 
      id: 1, 
      username: "admin01",
      fullName: "Nguyễn Văn A",
      role: "admin" as const,
      unit: "Công an Hà Nội",
      email: "admin@cahn.gov.vn",
      status: "active"
    },
    { 
      id: 2, 
      username: "cum1_leader",
      fullName: "Trần Văn B",
      role: "cluster_leader" as const,
      unit: "Cụm 1 - Công an xã, phường",
      email: "tranvanb@cahn.gov.vn",
      status: "active"
    },
    { 
      id: 3, 
      username: "dongda_user",
      fullName: "Lê Thị C",
      role: "user" as const,
      unit: "Công an phường Đống Đa",
      email: "lethic@cahn.gov.vn",
      status: "active"
    },
    { 
      id: 4, 
      username: "badinh_user",
      fullName: "Phạm Văn D",
      role: "user" as const,
      unit: "Công an phường Ba Đình",
      email: "phamvand@cahn.gov.vn",
      status: "inactive"
    },
  ];

  const columns = [
    { key: "username", label: "Tên đăng nhập" },
    { key: "fullName", label: "Họ và tên", width: "min-w-[150px]" },
    { 
      key: "role", 
      label: "Vai trò",
      render: (val: "admin" | "cluster_leader" | "user") => <RoleBadge role={val} />
    },
    { key: "unit", label: "Đơn vị/Cụm", width: "min-w-[200px]" },
    { key: "email", label: "Email", width: "min-w-[180px]" },
    { 
      key: "status", 
      label: "Trạng thái",
      render: (val: string) => (
        <Badge variant={val === "active" ? "default" : "secondary"}>
          {val === "active" ? "Hoạt động" : "Tạm khóa"}
        </Badge>
      )
    },
  ];

  return (
    <div>
      <ManagementTable
        title="Quản lý người dùng"
        columns={columns}
        data={mockUsers}
        onAdd={() => console.log("Add user")}
        onEdit={(item) => console.log("Edit user:", item)}
        onDelete={(item) => console.log("Delete user:", item)}
        searchPlaceholder="Tìm kiếm người dùng..."
        addButtonText="Thêm người dùng"
      />
    </div>
  );
}
