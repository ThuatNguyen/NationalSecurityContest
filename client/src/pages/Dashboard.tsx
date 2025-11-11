import DashboardStats from "@/components/DashboardStats";
import FilterPanel from "@/components/FilterPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DashboardProps {
  role: "admin" | "cluster_leader" | "user";
}

export default function Dashboard({ role }: DashboardProps) {
  const stats = [
    {
      title: role === "admin" ? "Tổng số đơn vị" : "Đơn vị trong cụm",
      value: role === "admin" ? "48" : "12",
      icon: Building2,
      trend: "+3 so với kỳ trước",
      trendUp: true,
      testId: "stat-units"
    },
    {
      title: "Đã tự chấm",
      value: role === "admin" ? "42" : role === "cluster_leader" ? "10" : "Hoàn thành",
      icon: CheckCircle,
      trend: "87.5% hoàn thành",
      trendUp: true,
      testId: "stat-self-scored"
    },
    {
      title: "Đã chấm cụm",
      value: role === "admin" ? "38" : role === "cluster_leader" ? "8" : "Chờ duyệt",
      icon: Users,
      trend: "79.2% hoàn thành",
      testId: "stat-cluster-scored"
    },
    {
      title: "Điểm trung bình",
      value: role === "user" ? "8.7" : "8.4",
      icon: TrendingUp,
      trend: "+0.3 so với kỳ trước",
      trendUp: true,
      testId: "stat-average"
    },
  ];

  const recentActivities = [
    { unit: "Công an phường Đống Đa", action: "đã hoàn thành tự chấm", time: "5 phút trước" },
    { unit: "Công an phường Ba Đình", action: "đã cập nhật điểm", time: "1 giờ trước" },
    { unit: "Phòng An ninh chính trị", action: "đã gửi báo cáo", time: "2 giờ trước" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">Kỳ thi đua năm 2025</p>
      </div>

      <FilterPanel role={role} />

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiến độ chấm điểm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tự chấm</span>
                <span className="font-medium">42/48 (87.5%)</span>
              </div>
              <Progress value={87.5} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Chấm cụm</span>
                <span className="font-medium">38/48 (79.2%)</span>
              </div>
              <Progress value={79.2} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Đã duyệt</span>
                <span className="font-medium">35/48 (72.9%)</span>
              </div>
              <Progress value={72.9} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p>
                      <span className="font-medium">{activity.unit}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {role === "user" && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Nhắc nhở: Hoàn thành tự chấm điểm</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hạn chót nộp điểm tự chấm là ngày 22/12/2025. Vui lòng hoàn thành đúng thời hạn.
                </p>
                <Button data-testid="button-start-scoring">Bắt đầu chấm điểm</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
