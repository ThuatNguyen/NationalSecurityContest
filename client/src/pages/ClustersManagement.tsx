import ManagementTable from "@/components/ManagementTable";
import { Badge } from "@/components/ui/badge";

export default function ClustersManagement() {
  const mockClusters = [
    { 
      id: 1, 
      name: "Cụm 1: Công an xã, phường, đặc khu", 
      totalUnits: 15,
      leader: "Đại tá Nguyễn Văn A",
      status: "active"
    },
    { 
      id: 2, 
      name: "Cụm 2: Các phòng An ninh nhân dân", 
      totalUnits: 8,
      leader: "Thượng tá Trần Văn B",
      status: "active"
    },
    { 
      id: 3, 
      name: "Cụm 3: Các phòng Cảnh sát điều tra", 
      totalUnits: 10,
      leader: "Thượng tá Lê Văn C",
      status: "active"
    },
    { 
      id: 4, 
      name: "Cụm 4: Các phòng Quản lý hành chính", 
      totalUnits: 7,
      leader: "Trung tá Phạm Văn D",
      status: "active"
    },
    { 
      id: 5, 
      name: "Cụm 5: Xây dựng lực lượng, Trực thuộc, Hậu cần", 
      totalUnits: 8,
      leader: "Trung tá Hoàng Văn E",
      status: "active"
    },
  ];

  const columns = [
    { key: "name", label: "Tên cụm thi đua", width: "min-w-[300px]" },
    { key: "leader", label: "Cụm trưởng", width: "min-w-[180px]" },
    { 
      key: "totalUnits", 
      label: "Số đơn vị", 
      render: (val: number) => <span className="font-medium">{val} đơn vị</span> 
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
        title="Quản lý cụm thi đua"
        columns={columns}
        data={mockClusters}
        onAdd={() => console.log("Add cluster")}
        onEdit={(item) => console.log("Edit cluster:", item)}
        onDelete={(item) => console.log("Delete cluster:", item)}
        searchPlaceholder="Tìm kiếm cụm thi đua..."
        addButtonText="Thêm cụm"
      />
    </div>
  );
}
