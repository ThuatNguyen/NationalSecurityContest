import ManagementTable from "@/components/ManagementTable";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CriteriaManagement() {
  const mockCriteria = [
    { 
      id: 1, 
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Chấp hành chủ trương, đường lối của Đảng",
      cluster: "Tất cả cụm",
      maxScore: 1.0,
      year: 2025,
      status: "active"
    },
    { 
      id: 2, 
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Thực hiện Nghị quyết, Chỉ thị của cấp ủy",
      cluster: "Tất cả cụm",
      maxScore: 1.0,
      year: 2025,
      status: "active"
    },
    { 
      id: 3, 
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Đảm bảo an ninh chính trị nội bộ",
      cluster: "Cụm 1",
      maxScore: 2.0,
      year: 2025,
      status: "active"
    },
    { 
      id: 4, 
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Phòng, chống tội phạm và vi phạm pháp luật",
      cluster: "Cụm 1",
      maxScore: 3.0,
      year: 2025,
      status: "active"
    },
  ];

  const columns = [
    { key: "groupName", label: "Nhóm tiêu chí", width: "min-w-[200px]" },
    { key: "name", label: "Tiêu chí", width: "min-w-[250px]" },
    { key: "cluster", label: "Áp dụng cho cụm", width: "min-w-[150px]" },
    { 
      key: "maxScore", 
      label: "Điểm tối đa",
      render: (val: number) => <span className="font-medium">{val.toFixed(1)}</span>
    },
    { key: "year", label: "Năm" },
    { 
      key: "status", 
      label: "Trạng thái",
      render: (val: string) => (
        <Badge variant={val === "active" ? "default" : "secondary"}>
          {val === "active" ? "Đang áp dụng" : "Ngưng áp dụng"}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tiêu chí thi đua</h1>
        <p className="text-muted-foreground mt-1">Cấu hình tiêu chí cho từng cụm thi đua</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-year-criteria" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              Năm áp dụng
            </Label>
            <Select defaultValue="2025">
              <SelectTrigger id="filter-year-criteria" data-testid="select-year-criteria">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-cluster-criteria" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              Cụm thi đua
            </Label>
            <Select defaultValue="all">
              <SelectTrigger id="filter-cluster-criteria" data-testid="select-cluster-criteria">
                <SelectValue placeholder="Chọn cụm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cụm</SelectItem>
                <SelectItem value="1">Cụm 1</SelectItem>
                <SelectItem value="2">Cụm 2</SelectItem>
                <SelectItem value="3">Cụm 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <ManagementTable
        title="Danh sách tiêu chí"
        columns={columns}
        data={mockCriteria}
        onAdd={() => console.log("Add criteria")}
        onEdit={(item) => console.log("Edit criteria:", item)}
        onDelete={(item) => console.log("Delete criteria:", item)}
        searchPlaceholder="Tìm kiếm tiêu chí..."
        addButtonText="Thêm tiêu chí"
      />
    </div>
  );
}
