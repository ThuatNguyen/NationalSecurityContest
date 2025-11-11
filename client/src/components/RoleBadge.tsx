import { Badge } from "@/components/ui/badge";
import { Shield, Users, Building2 } from "lucide-react";

interface RoleBadgeProps {
  role: "admin" | "cluster_leader" | "user";
  className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleConfig = {
    admin: {
      label: "Quản trị viên",
      icon: Shield,
      variant: "default" as const,
    },
    cluster_leader: {
      label: "Cụm trưởng",
      icon: Users,
      variant: "secondary" as const,
    },
    user: {
      label: "Đơn vị",
      icon: Building2,
      variant: "outline" as const,
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className} data-testid={`badge-role-${role}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
