import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ClipboardList, 
  Calendar, 
  FileText,
  Settings,
  ChevronDown,
  LogOut,
  Shield,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import RoleBadge from "./RoleBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSession } from "@/lib/useSession";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon } from "lucide-react";

interface AppSidebarProps {
  role: "admin" | "cluster_leader" | "user";
  user: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    clusterId: string | null;
    unitId: string | null;
  };
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  testId: string;
  allowedRoles: ("admin" | "cluster_leader" | "user")[];
}

interface Unit {
  id: string;
  name: string;
  clusterId: string;
  description?: string;
  createdAt: string;
}

interface Cluster {
  id: string;
  name: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { 
    title: "Tổng quan", 
    url: "/", 
    icon: LayoutDashboard, 
    testId: "nav-dashboard",
    allowedRoles: ["admin", "cluster_leader", "user"]
  },
  { 
    title: "Kỳ thi đua", 
    url: "/periods", 
    icon: Calendar, 
    testId: "nav-periods",
    allowedRoles: ["admin", "cluster_leader", "user"]
  },
  { 
    title: "Báo cáo", 
    url: "/reports", 
    icon: FileText, 
    testId: "nav-reports",
    allowedRoles: ["admin", "cluster_leader", "user"]
  },
];

export const SETTINGS_NAV_ITEMS: NavItem[] = [
  { 
    title: "Quản lý đơn vị", 
    url: "/settings/units", 
    icon: Building2, 
    testId: "nav-units",
    allowedRoles: ["admin", "cluster_leader"]
  },
  { 
    title: "Quản lý cụm", 
    url: "/settings/clusters", 
    icon: Users, 
    testId: "nav-clusters",
    allowedRoles: ["admin"]
  },
  { 
    title: "Tiêu chí thi đua", 
    url: "/settings/criteria", 
    icon: ClipboardList, 
    testId: "nav-criteria",
    allowedRoles: ["admin", "cluster_leader"]
  },
  { 
    title: "Quản lý người dùng", 
    url: "/settings/users", 
    icon: Users, 
    testId: "nav-users",
    allowedRoles: ["admin", "cluster_leader"]
  },
];

export function AppSidebar({ role, user }: AppSidebarProps) {
  const [location] = useLocation();
  const { logout } = useSession();

  const { data: unit } = useQuery<Unit>({
    queryKey: ['/api/units', user.unitId],
    enabled: !!user.unitId,
  });

  const { data: cluster } = useQuery<Cluster>({
    queryKey: ['/api/clusters', user.clusterId],
    enabled: !!user.clusterId && role !== "admin",
  });

  const visibleMainItems = MAIN_NAV_ITEMS.filter(item => item.allowedRoles.includes(role));
  const visibleSettingsItems = SETTINGS_NAV_ITEMS.filter(item => item.allowedRoles.includes(role));
  const hasSettingsAccess = visibleSettingsItems.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">Hệ thống chấm điểm</h2>
            <p className="text-xs text-muted-foreground">Vì ANTQ</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={item.testId}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {hasSettingsAccess && (
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="nav-settings">
                        <Settings className="w-4 h-4" />
                        <span>Cài đặt</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleSettingsItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={location === item.url} data-testid={item.testId}>
                              <Link href={item.url}>
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.fullName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-username">{user.fullName}</p>
              {cluster && <p className="text-xs text-muted-foreground truncate">{cluster.name}</p>}
              {unit && <p className="text-xs text-muted-foreground truncate">{unit.name}</p>}
            </div>
          </div>
          <RoleBadge role={role} className="w-full justify-center" />
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
