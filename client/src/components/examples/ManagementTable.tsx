import ManagementTable from "../ManagementTable";
import { Badge } from "@/components/ui/badge";

export default function ManagementTableExample() {
  const mockUnits = [
    { id: 1, name: "Công an phường Đống Đa", cluster: "Cụm 1", members: 25, status: "active" },
    { id: 2, name: "Công an phường Ba Đình", cluster: "Cụm 1", members: 30, status: "active" },
    { id: 3, name: "Phòng An ninh chính trị", cluster: "Cụm 2", members: 18, status: "inactive" },
  ];

  const columns = [
    { key: "name", label: "Tên đơn vị", width: "min-w-[200px]" },
    { key: "cluster", label: "Cụm thi đua" },
    { key: "members", label: "Số thành viên", render: (val: number) => <span className="font-medium">{val}</span> },
    { 
      key: "status", 
      label: "Trạng thái",
      render: (val: string) => (
        <Badge variant={val === "active" ? "default" : "secondary"}>
          {val === "active" ? "Hoạt động" : "Không hoạt động"}
        </Badge>
      )
    },
  ];

  return (
    <div className="p-6">
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
