import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  testId?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, testId }: StatCardProps) {
  return (
    <Card className="p-6" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2" data-testid={`${testId}-value`}>{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    testId?: string;
  }>;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
