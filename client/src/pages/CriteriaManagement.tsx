import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus } from "lucide-react";
import { useState } from "react";

interface Criteria {
  id: number;
  groupName: string;
  name: string;
  maxScore: number;
}

export default function CriteriaManagement() {
  const [mockCriteria] = useState<Criteria[]>([
    { 
      id: 1, 
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Chấp hành chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước",
      maxScore: 1.0,
    },
    { 
      id: 2, 
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Thực hiện Nghị quyết, Chỉ thị của cấp ủy, chính quyền địa phương",
      maxScore: 1.0,
    },
    { 
      id: 3, 
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Kết quả thực hiện chức năng tham mưu với cấp ủy, chính quyền địa phương",
      maxScore: 2.0,
    },
    { 
      id: 4, 
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Đảm bảo an ninh chính trị nội bộ, phát hiện xử lý vi phạm",
      maxScore: 2.0,
    },
    { 
      id: 5, 
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Phòng, chống tội phạm và vi phạm pháp luật trên địa bàn",
      maxScore: 3.0,
    },
    { 
      id: 6, 
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Công tác quản lý hành chính về trật tự xã hội",
      maxScore: 2.0,
    },
    { 
      id: 7, 
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Xây dựng lực lượng trong sạch, vững mạnh toàn diện",
      maxScore: 2.0,
    },
    { 
      id: 8, 
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Công tác đào tạo, bồi dưỡng nâng cao trình độ cán bộ",
      maxScore: 1.0,
    },
  ]);

  const groupedCriteria = mockCriteria.reduce((acc, criteria) => {
    if (!acc[criteria.groupName]) {
      acc[criteria.groupName] = [];
    }
    acc[criteria.groupName].push(criteria);
    return acc;
  }, {} as Record<string, Criteria[]>);

  const calculateGroupTotal = (items: Criteria[]) => {
    return items.reduce((sum, item) => sum + item.maxScore, 0);
  };

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
            <Select defaultValue="1">
              <SelectTrigger id="filter-cluster-criteria" data-testid="select-cluster-criteria">
                <SelectValue placeholder="Chọn cụm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Cụm 1: Công an xã, phường</SelectItem>
                <SelectItem value="2">Cụm 2: An ninh nhân dân</SelectItem>
                <SelectItem value="3">Cụm 3: Cảnh sát điều tra</SelectItem>
                <SelectItem value="4">Cụm 4: Quản lý hành chính</SelectItem>
                <SelectItem value="5">Cụm 5: Xây dựng lực lượng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Danh sách tiêu chí</h2>
          <div className="flex gap-3 flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Tìm kiếm tiêu chí..."
              className="flex-1"
              data-testid="input-search"
            />
            <Button data-testid="button-add">
              <Plus className="w-4 h-4 mr-2" />
              Thêm tiêu chí
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-12">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[400px]">Tên tiêu chí</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Điểm tối đa</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedCriteria).map(([groupName, items], groupIndex) => {
                  const groupTotal = calculateGroupTotal(items);

                  return (
                    <>
                      <tr className="bg-accent/50" key={`group-${groupName}`}>
                        <td colSpan={2} className="px-4 py-2 font-semibold text-sm">
                          {groupName}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold text-sm">
                          {groupTotal.toFixed(1)}
                        </td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {items.map((item, itemIndex) => (
                        <tr key={item.id} className="border-b hover-elevate" data-testid={`row-criteria-${item.id}`}>
                          <td className="px-4 py-3 text-sm text-center">{groupIndex * 10 + itemIndex + 1}</td>
                          <td className="px-4 py-3 text-sm pl-8">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-center font-medium" data-testid={`text-maxscore-${item.id}`}>
                            {item.maxScore.toFixed(1)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => console.log("Edit criteria:", item)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => console.log("Delete criteria:", item)}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
                <tr className="bg-muted font-bold">
                  <td colSpan={2} className="px-4 py-3 text-sm">TỔNG CỘNG</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {mockCriteria.reduce((sum, c) => sum + c.maxScore, 0).toFixed(1)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Hiển thị {mockCriteria.length} tiêu chí</p>
        </div>
      </div>
    </div>
  );
}
