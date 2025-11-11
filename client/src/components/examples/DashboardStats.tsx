import DashboardStats from "../DashboardStats";
import { Building2, Users, CheckCircle, TrendingUp } from "lucide-react";

export default function DashboardStatsExample() {
  const stats = [
    {
      title: "Tổng số đơn vị",
      value: "48",
      icon: Building2,
      trend: "+3 so với kỳ trước",
      trendUp: true,
      testId: "stat-total-units"
    },
    {
      title: "Đã tự chấm",
      value: "42",
      icon: CheckCircle,
      trend: "87.5% hoàn thành",
      trendUp: true,
      testId: "stat-self-scored"
    },
    {
      title: "Đã chấm cụm",
      value: "38",
      icon: Users,
      trend: "79.2% hoàn thành",
      testId: "stat-cluster-scored"
    },
    {
      title: "Điểm trung bình",
      value: "8.4",
      icon: TrendingUp,
      trend: "+0.3 so với kỳ trước",
      trendUp: true,
      testId: "stat-average-score"
    },
  ];

  return (
    <div className="p-6">
      <DashboardStats stats={stats} />
    </div>
  );
}
