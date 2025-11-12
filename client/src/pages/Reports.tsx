import FilterPanel from "@/components/FilterPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";

interface UnitScore {
  id: number;
  unitName: string;
  selfScore: number;
  clusterScore: number;
  approvedScore: number;
  maxScore: number;
  ranking: number;
  status: string;
}

export default function Reports() {
  const mockScores: UnitScore[] = [
    {
      id: 1,
      unitName: "Công an phường Đống Đa",
      selfScore: 28.5,
      clusterScore: 27.8,
      approvedScore: 27.8,
      maxScore: 30,
      ranking: 1,
      status: "approved"
    },
    {
      id: 2,
      unitName: "Công an phường Ba Đình",
      selfScore: 27.2,
      clusterScore: 26.5,
      approvedScore: 26.5,
      maxScore: 30,
      ranking: 2,
      status: "approved"
    },
    {
      id: 3,
      unitName: "Công an phường Hoàn Kiếm",
      selfScore: 26.8,
      clusterScore: 25.9,
      approvedScore: 0,
      maxScore: 30,
      ranking: 3,
      status: "pending"
    },
    {
      id: 4,
      unitName: "Công an phường Hai Bà Trưng",
      selfScore: 25.5,
      clusterScore: 0,
      approvedScore: 0,
      maxScore: 30,
      ranking: 4,
      status: "cluster_pending"
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Đã duyệt", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      cluster_pending: { label: "Chờ chấm cụm", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  const totalUnits = mockScores.length;
  const completedUnits = mockScores.filter(s => s.status === "approved").length;
  const averageScore = mockScores.reduce((sum, s) => sum + s.approvedScore, 0) / totalUnits;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo thi đua</h1>
          <p className="text-muted-foreground mt-1">Tổng hợp kết quả chấm điểm theo cụm</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            In báo cáo
          </Button>
          <Button data-testid="button-export">
            <FileDown className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <FilterPanel role="admin" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số đơn vị</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedUnits}/{totalUnits}</p>
            <p className="text-xs text-muted-foreground mt-1">{((completedUnits/totalUnits)*100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Điểm trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{averageScore.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">/{mockScores[0].maxScore} điểm</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng điểm đơn vị trong cụm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-16">
                      Hạng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[250px]">
                      Đơn vị
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">
                      Tự chấm
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">
                      Cụm chấm
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">
                      Điểm duyệt
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">
                      Tỷ lệ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-40">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockScores.map((score) => (
                    <tr key={score.id} className="border-b hover-elevate" data-testid={`row-unit-${score.id}`}>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            score.ranking === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            score.ranking === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                            score.ranking === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-muted text-foreground'
                          }`}>
                            {score.ranking}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" data-testid={`text-unit-${score.id}`}>
                        {score.unitName}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium" data-testid={`text-selfscore-${score.id}`}>
                        {score.selfScore > 0 ? score.selfScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium" data-testid={`text-clusterscore-${score.id}`}>
                        {score.clusterScore > 0 ? score.clusterScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold" data-testid={`text-approvedscore-${score.id}`}>
                        {score.approvedScore > 0 ? score.approvedScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {score.approvedScore > 0 ? `${((score.approvedScore / score.maxScore) * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(score.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
