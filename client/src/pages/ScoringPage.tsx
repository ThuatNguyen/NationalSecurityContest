import ScoringTable from "@/components/ScoringTable";
import FilterPanel from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, Send } from "lucide-react";

interface ScoringPageProps {
  role: "admin" | "cluster_leader" | "user";
}

export default function ScoringPage({ role }: ScoringPageProps) {
  const mockCriteria = [
    {
      id: "1.1",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Chấp hành chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước",
      maxScore: 1.0,
      selfScore: 0.9,
      clusterScore: 0.85,
      approvedScore: 0.85,
      comment: "Thực hiện tốt các chỉ thị"
    },
    {
      id: "1.2",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Thực hiện Nghị quyết, Chỉ thị của cấp ủy, chính quyền địa phương",
      maxScore: 1.0,
      selfScore: 0.95,
    },
    {
      id: "1.3",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Kết quả thực hiện chức năng tham mưu với cấp ủy, chính quyền địa phương",
      maxScore: 2.0,
      selfScore: 1.8,
    },
    {
      id: "2.1",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Đảm bảo an ninh chính trị nội bộ, phát hiện xử lý vi phạm",
      maxScore: 2.0,
      selfScore: 1.75,
      clusterScore: 1.7,
    },
    {
      id: "2.2",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Phòng, chống tội phạm và vi phạm pháp luật trên địa bàn",
      maxScore: 3.0,
      selfScore: 2.5,
      clusterScore: 2.3,
      comment: "Cần tăng cường tuần tra"
    },
    {
      id: "2.3",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Công tác quản lý hành chính về trật tự xã hội",
      maxScore: 2.0,
    },
    {
      id: "3.1",
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Xây dựng lực lượng trong sạch, vững mạnh toàn diện",
      maxScore: 2.0,
      selfScore: 1.9,
    },
    {
      id: "3.2",
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Công tác đào tạo, bồi dưỡng nâng cao trình độ cán bộ",
      maxScore: 1.0,
      selfScore: 0.9,
      clusterScore: 0.85,
    },
  ];

  const pageTitle = role === "user" ? "Tự chấm điểm" : role === "cluster_leader" ? "Chấm điểm cụm" : "Quản lý chấm điểm";
  const pageDescription = role === "user" 
    ? "Nhập điểm tự đánh giá của đơn vị theo từng tiêu chí" 
    : role === "cluster_leader"
    ? "Chấm điểm và nhận xét cho các đơn vị trong cụm"
    : "Xem và duyệt điểm chấm của tất cả đơn vị";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground mt-1">{pageDescription}</p>
      </div>

      <FilterPanel role={role} />

      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <div className="flex items-start gap-3">
          <div className="text-sm">
            <p className="font-semibold mb-1">Hướng dẫn chấm điểm:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Nhập điểm từ 0 đến giá trị điểm tối đa của mỗi tiêu chí</li>
              <li>Lưu nháp thường xuyên để tránh mất dữ liệu</li>
              <li>Nhấn "Gửi duyệt" khi hoàn thành tất cả tiêu chí</li>
            </ul>
          </div>
        </div>
      </Card>

      <ScoringTable role={role} criteria={mockCriteria} />

      <div className="flex justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t">
        <Button variant="outline" data-testid="button-save-draft">
          <Save className="w-4 h-4 mr-2" />
          Lưu nháp
        </Button>
        <Button data-testid="button-submit">
          <Send className="w-4 h-4 mr-2" />
          {role === "user" ? "Gửi duyệt" : "Hoàn thành chấm điểm"}
        </Button>
      </div>
    </div>
  );
}
