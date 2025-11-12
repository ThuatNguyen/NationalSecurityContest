import FilterPanel from "@/components/FilterPanel";
import ManagementTable from "@/components/ManagementTable";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function EvaluationPeriods() {
  const mockPeriods = [
    { 
      id: 1, 
      year: 2025, 
      name: "Kỳ thi đua năm 2025",
      startDate: "01/01/2025", 
      endDate: "31/12/2025",
      status: "active",
      progress: "87.5%"
    },
    { 
      id: 2, 
      year: 2024, 
      name: "Kỳ thi đua năm 2024",
      startDate: "01/01/2024", 
      endDate: "31/12/2024",
      status: "completed",
      progress: "100%"
    },
    { 
      id: 3, 
      year: 2023, 
      name: "Kỳ thi đua năm 2023",
      startDate: "01/01/2023", 
      endDate: "31/12/2023",
      status: "completed",
      progress: "100%"
    },
  ];

  const columns = [
    { key: "year", label: "Năm", render: (val: number) => <span className="font-semibold">{val}</span> },
    { key: "name", label: "Tên kỳ thi đua", width: "min-w-[250px]" },
    { key: "startDate", label: "Ngày bắt đầu" },
    { key: "endDate", label: "Ngày kết thúc" },
    { key: "progress", label: "Tiến độ", render: (val: string) => <span className="font-medium">{val}</span> },
    { 
      key: "status", 
      label: "Trạng thái",
      render: (val: string) => (
        <Badge variant={val === "active" ? "default" : "secondary"}>
          {val === "active" ? "Đang diễn ra" : "Đã kết thúc"}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý kỳ thi đua</h1>
        <p className="text-muted-foreground mt-1">Quản lý các kỳ thi đua theo năm</p>
      </div>

      <FilterPanel role="admin" />

      <ManagementTable
        title="Danh sách kỳ thi đua"
        columns={columns}
        data={mockPeriods}
        onAdd={() => console.log("Add period")}
        onEdit={(item) => console.log("Edit period:", item)}
        onDelete={(item) => console.log("Delete period:", item)}
        searchPlaceholder="Tìm kiếm kỳ thi đua..."
        addButtonText="Thêm kỳ thi đua"
      />
    </div>
  );
}
