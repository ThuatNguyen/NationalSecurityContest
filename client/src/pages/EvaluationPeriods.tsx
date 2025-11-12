import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Criteria {
  id: string;
  groupName: string;
  name: string;
  maxScore: number;
  selfScore?: number;
  review1Score?: number;
  explanation?: string;
  review2Score?: number;
  finalScore?: number;
}

export default function EvaluationPeriods() {
  const mockCriteria: Criteria[] = [
    {
      id: "1.1",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Chấp hành chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước",
      maxScore: 1.0,
      selfScore: 0.9,
      review1Score: 0.85,
      explanation: "Đơn vị thực hiện tốt các chủ trương",
      review2Score: 0.85,
      finalScore: 0.85,
    },
    {
      id: "1.2",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Thực hiện Nghị quyết, Chỉ thị của cấp ủy, chính quyền địa phương",
      maxScore: 1.0,
      selfScore: 0.95,
      review1Score: 0.9,
      review2Score: 0.9,
      finalScore: 0.9,
    },
    {
      id: "1.3",
      groupName: "I. CÔNG TÁC XÂY DỰNG ĐẢNG",
      name: "Kết quả thực hiện chức năng tham mưu với cấp ủy, chính quyền địa phương",
      maxScore: 2.0,
      selfScore: 1.8,
      review1Score: 1.7,
      review2Score: 1.75,
      finalScore: 1.75,
    },
    {
      id: "2.1",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Đảm bảo an ninh chính trị nội bộ, phát hiện xử lý vi phạm",
      maxScore: 2.0,
      selfScore: 1.75,
      review1Score: 1.7,
      review2Score: 1.7,
      finalScore: 1.7,
    },
    {
      id: "2.2",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Phòng, chống tội phạm và vi phạm pháp luật trên địa bàn",
      maxScore: 3.0,
      selfScore: 2.5,
      review1Score: 2.3,
      explanation: "Cần tăng cường tuần tra khu vực",
      review2Score: 2.4,
      finalScore: 2.4,
    },
    {
      id: "2.3",
      groupName: "II. CÔNG TÁC AN NINH TRẬT TỰ",
      name: "Công tác quản lý hành chính về trật tự xã hội",
      maxScore: 2.0,
      selfScore: 1.8,
      review1Score: 1.75,
      review2Score: 1.75,
      finalScore: 1.75,
    },
    {
      id: "3.1",
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Xây dựng lực lượng trong sạch, vững mạnh toàn diện",
      maxScore: 2.0,
      selfScore: 1.9,
      review1Score: 1.85,
      review2Score: 1.85,
      finalScore: 1.85,
    },
    {
      id: "3.2",
      groupName: "III. CÔNG TÁC XÂY DỰNG LỰC LƯỢNG",
      name: "Công tác đào tạo, bồi dưỡng nâng cao trình độ cán bộ",
      maxScore: 1.0,
      selfScore: 0.9,
      review1Score: 0.85,
      review2Score: 0.85,
      finalScore: 0.85,
    },
  ];

  let currentGroup = "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kỳ thi đua</h1>
        <p className="text-muted-foreground mt-1">Xem và quản lý điểm thi đua theo kỳ</p>
      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-md">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-year" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Năm thi đua
          </Label>
          <Select defaultValue="2025">
            <SelectTrigger id="filter-year" data-testid="select-year">
              <SelectValue placeholder="Chọn năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-cluster" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Cụm thi đua
          </Label>
          <Select defaultValue="1">
            <SelectTrigger id="filter-cluster" data-testid="select-cluster">
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

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-unit" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Đơn vị
          </Label>
          <Select defaultValue="1">
            <SelectTrigger id="filter-unit" data-testid="select-unit">
              <SelectValue placeholder="Chọn đơn vị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Công an phường Đống Đa</SelectItem>
              <SelectItem value="2">Công an phường Ba Đình</SelectItem>
              <SelectItem value="3">Công an phường Hoàn Kiếm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-12">STT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[300px]">Tên tiêu chí</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">Điểm tối đa</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24">Điểm tự chấm</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Thẩm định lần 1</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[200px]">Giải trình</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Thẩm định lần 2</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Điểm cuối cùng</th>
              </tr>
            </thead>
            <tbody>
              {mockCriteria.map((item, index) => {
                const showGroupHeader = item.groupName !== currentGroup;
                if (showGroupHeader) currentGroup = item.groupName;

                return (
                  <>
                    {showGroupHeader && (
                      <tr className="bg-accent/50" key={`group-${item.groupName}`}>
                        <td colSpan={8} className="px-4 py-2 font-semibold text-sm">
                          {item.groupName}
                        </td>
                      </tr>
                    )}
                    <tr key={item.id} className="border-b hover-elevate" data-testid={`row-criteria-${item.id}`}>
                      <td className="px-4 py-3 text-sm text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-sm pl-8">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-center font-medium" data-testid={`text-maxscore-${item.id}`}>
                        {item.maxScore}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-sm" data-testid={`text-selfscore-${item.id}`}>
                          {item.selfScore ? item.selfScore.toFixed(2) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-sm" data-testid={`text-review1-${item.id}`}>
                          {item.review1Score ? item.review1Score.toFixed(2) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground" data-testid={`text-explanation-${item.id}`}>
                          {item.explanation || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-sm" data-testid={`text-review2-${item.id}`}>
                          {item.review2Score ? item.review2Score.toFixed(2) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-sm text-primary" data-testid={`text-finalscore-${item.id}`}>
                          {item.finalScore ? item.finalScore.toFixed(2) : '-'}
                        </span>
                      </td>
                    </tr>
                  </>
                );
              })}
              <tr className="bg-muted font-bold">
                <td colSpan={2} className="px-4 py-3 text-sm">TỔNG CỘNG</td>
                <td className="px-4 py-3 text-sm text-center">
                  {mockCriteria.reduce((sum, c) => sum + c.maxScore, 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {mockCriteria.reduce((sum, c) => sum + (c.selfScore || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {mockCriteria.reduce((sum, c) => sum + (c.review1Score || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center"></td>
                <td className="px-4 py-3 text-sm text-center">
                  {mockCriteria.reduce((sum, c) => sum + (c.review2Score || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center text-primary">
                  {mockCriteria.reduce((sum, c) => sum + (c.finalScore || 0), 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
