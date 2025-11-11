import ManagementTable from "@/components/ManagementTable";
import { Badge } from "@/components/ui/badge";

export default function UnitsManagement() {
  const mockUnits = [
    { id: 1, name: "Công an phường Đống Đa", cluster: "Cụm 1: Công an xã, phường", members: 25, leader: "Trần Văn B", status: "active" },
    { id: 2, name: "Công an phường Ba Đình", cluster: "Cụm 1: Công an xã, phường", members: 30, leader: "Nguyễn Văn C", status: "active" },
    { id: 3, name: "Công an phường Hoàn Kiếm", cluster: "Cụm 1: Công an xã, phường", members: 28, leader: "Lê Thị D", status: "active" },
    { id: 4, name: "Phòng An ninh chính trị", cluster: "Cụm 2: An ninh nhân dân", members: 18, leader: "Phạm Văn E", status: "active" },
    { id: 5, name: "Phòng An ninh kinh tế", cluster: "Cụm 2: An ninh nhân dân", members: 15, leader: "Hoàng Văn F", status: "inactive" },
    { id: 6, name: "Phòng Cảnh sát hình sự", cluster: "Cụm 3: Cảnh sát điều tra", members: 22, leader: "Đỗ Văn G", status: "active" },
  ];

  const columns = [
    { key: "name", label: "Tên đơn vị", width: "min-w-[200px]" },
    { key: "cluster", label: "Cụm thi đua", width: "min-w-[180px]" },
    { key: "leader", label: "Người phụ trách" },
    { 
      key: "members", 
      label: "Số thành viên", 
      render: (val: number) => <span className="font-medium">{val} người</span> 
    },
    { 
      key: "status", 
      label: "Trạng thái",
      render: (val: string) => (
        <Badge variant={val === "active" ? "default" : "secondary"}>
          {val === "active" ? "Hoạt động" : "Tạm ngưng"}
        </Badge>
      )
    },
  ];

  return (
    <div>
      <ManagementTable
        title="Quản lý đơn vị"
        columns={columns}
        data={mockUnits}
        onAdd={() => console.log("Add unit")}
        onEdit={(item) => console.log("Edit unit:", item)}
        onDelete={(item) => console.log("Delete unit:", item)}
        searchPlaceholder="Tìm kiếm đơn vị..."
        addButtonText="Thêm đơn vị"
      />
    </div>
  );
}
