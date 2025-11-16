import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, SETTINGS_NAV_ITEMS } from "@/components/AppSidebar";
import LoginPage from "@/components/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import ScoringPage from "@/pages/ScoringPage";
import UnitsManagement from "@/pages/UnitsManagement";
import ClustersManagement from "@/pages/ClustersManagement";
import CriteriaTreeManagement from "@/pages/CriteriaTreeManagement";
import CriteriaScoring from "@/pages/CriteriaScoring";
import UsersManagement from "@/pages/UsersManagement";
import EvaluationPeriods from "@/pages/EvaluationPeriods";
import Reports from "@/pages/Reports";
import CompetitionManagement from "@/pages/CompetitionManagement";
import CompetitionDetail from "@/pages/CompetitionDetail";
import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionProvider, useSession } from "@/lib/useSession";
import { Card } from "@/components/ui/card";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function Router({ role }: { role: "admin" | "cluster_leader" | "user" }) {
  const unitsAllowedRoles = SETTINGS_NAV_ITEMS.find(item => item.url === "/settings/units")?.allowedRoles || ["admin"];
  const clustersAllowedRoles = SETTINGS_NAV_ITEMS.find(item => item.url === "/settings/clusters")?.allowedRoles || ["admin"];
  const criteriaAllowedRoles = SETTINGS_NAV_ITEMS.find(item => item.url === "/settings/criteria")?.allowedRoles || ["admin"];
  const usersAllowedRoles = SETTINGS_NAV_ITEMS.find(item => item.url === "/settings/users")?.allowedRoles || ["admin"];

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard role={role} />} />
      <Route path="/periods" component={EvaluationPeriods} />
      <Route path="/reports" component={Reports} />
      <Route path="/scoring" component={() => <ScoringPage role={role} />} />
      <Route path="/self-scoring" component={() => <ScoringPage role="user" />} />
      <Route path="/settings/units">
        <ProtectedRoute allowedRoles={unitsAllowedRoles}>
          <UnitsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/clusters">
        <ProtectedRoute allowedRoles={clustersAllowedRoles}>
          <ClustersManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/criteria">
        <ProtectedRoute allowedRoles={criteriaAllowedRoles}>
          <CriteriaTreeManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/criteria-scoring">
        <CriteriaScoring />
      </Route>
      <Route path="/settings/users">
        <ProtectedRoute allowedRoles={usersAllowedRoles}>
          <UsersManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/competitions">
        <ProtectedRoute allowedRoles={["admin"]}>
          <CompetitionManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/competitions/:id">
        <ProtectedRoute allowedRoles={["admin"]}>
          <CompetitionDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/my-units" component={() => <div className="p-6">Đơn vị của tôi</div>} />
      <Route path="/cluster-reports" component={() => <div className="p-6">Báo cáo cụm</div>} />
      <Route path="/results" component={() => <div className="p-6">Kết quả</div>} />
      <Route path="/history" component={() => <div className="p-6">Lịch sử</div>} />
      <Route component={() => <div className="p-6">404 - Không tìm thấy trang</div>} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading, isError } = useSession();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !user) {
    return <LoginPage />;
  }

  const userRole = user.role as "admin" | "cluster_leader" | "user";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          role={userRole}
          user={user}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-screen-2xl mx-auto">
              <Router role={userRole} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
