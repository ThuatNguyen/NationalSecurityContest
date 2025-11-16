import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface EvaluationPeriod {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface Cluster {
  id: string;
  name: string;
}

interface ClusterStats {
  cluster: Cluster;
  totalUnits: number;
  evaluationsCreated: number;
  statusCounts: {
    draft: number;
    submitted: number;
    review1_completed: number;
    review2_completed: number;
    finalized: number;
  };
}

interface PeriodDetails {
  period: EvaluationPeriod;
  clusters: Cluster[];
  clusterStats: ClusterStats[];
  totalEvaluations: number;
}

const statusMap = {
  draft: { label: "Nháp", color: "bg-gray-500" },
  active: { label: "Đang diễn ra", color: "bg-green-500" },
  review1: { label: "Phúc tra 1", color: "bg-blue-500" },
  review2: { label: "Phúc tra 2", color: "bg-purple-500" },
  completed: { label: "Hoàn thành", color: "bg-slate-600" },
};

export default function CompetitionDetail() {
  const [match, params] = useRoute("/settings/competitions/:id");
  const [, setLocation] = useLocation();
  const periodId = params?.id;

  const { data, isLoading } = useQuery<PeriodDetails>({
    queryKey: [`/api/evaluation-periods/${periodId}/details`],
    enabled: !!periodId,
  });

  if (!match || !periodId) {
    return <div>Invalid route</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto py-6">Đang tải...</div>;
  }

  if (!data) {
    return <div className="container mx-auto py-6">Không tìm thấy kỳ thi đua</div>;
  }

  const { period, clusters, clusterStats, totalEvaluations } = data;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setLocation("/settings/competitions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">{period.name}</h1>
        <Badge className={statusMap[period.status as keyof typeof statusMap]?.color || "bg-gray-500"}>
          {statusMap[period.status as keyof typeof statusMap]?.label || period.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Năm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{period.year}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {format(new Date(period.startDate), "dd/MM/yyyy")} -{" "}
              {format(new Date(period.endDate), "dd/MM/yyyy")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Số cụm tham gia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clusters.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo cụm</CardTitle>
          <CardDescription>
            Tổng số đánh giá: {totalEvaluations}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusterStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có cụm nào được gán
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cụm</TableHead>
                  <TableHead>Tổng đơn vị</TableHead>
                  <TableHead>Đã khởi tạo</TableHead>
                  <TableHead>Nháp</TableHead>
                  <TableHead>Đã nộp</TableHead>
                  <TableHead>Phúc tra 1</TableHead>
                  <TableHead>Phúc tra 2</TableHead>
                  <TableHead>Hoàn thành</TableHead>
                  <TableHead>Tỷ lệ hoàn thành</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusterStats.map((stat) => {
                  const completionRate = stat.totalUnits > 0
                    ? ((stat.evaluationsCreated / stat.totalUnits) * 100).toFixed(1)
                    : "0";
                  
                  return (
                    <TableRow key={stat.cluster.id}>
                      <TableCell className="font-medium">{stat.cluster.name}</TableCell>
                      <TableCell>{stat.totalUnits}</TableCell>
                      <TableCell>{stat.evaluationsCreated}</TableCell>
                      <TableCell>{stat.statusCounts.draft}</TableCell>
                      <TableCell>{stat.statusCounts.submitted}</TableCell>
                      <TableCell>{stat.statusCounts.review1_completed}</TableCell>
                      <TableCell>{stat.statusCounts.review2_completed}</TableCell>
                      <TableCell>{stat.statusCounts.finalized}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16">{completionRate}%</div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
