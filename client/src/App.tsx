import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import LoginPage from "@/components/LoginPage";
import Dashboard from "@/pages/Dashboard";
import ScoringPage from "@/pages/ScoringPage";
import UnitsManagement from "@/pages/UnitsManagement";
import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard role={role} />} />
      <Route path="/scoring" component={() => <ScoringPage role={role} />} />
      <Route path="/self-scoring" component={() => <ScoringPage role="user" />} />
      <Route path="/units" component={UnitsManagement} />
      <Route path="/my-units" component={() => <div className="p-6">Đơn vị của tôi</div>} />
      <Route path="/clusters" component={() => <div className="p-6">Quản lý cụm</div>} />
      <Route path="/criteria" component={() => <div className="p-6">Tiêu chí thi đua</div>} />
      <Route path="/periods" component={() => <div className="p-6">Kỳ thi đua</div>} />
      <Route path="/reports" component={() => <div className="p-6">Báo cáo</div>} />
      <Route path="/cluster-reports" component={() => <div className="p-6">Báo cáo cụm</div>} />
      <Route path="/results" component={() => <div className="p-6">Kết quả</div>} />
      <Route path="/history" component={() => <div className="p-6">Lịch sử</div>} />
      <Route component={() => <div className="p-6">404 - Không tìm thấy trang</div>} />
    </Switch>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userRole] = useState<"admin" | "cluster_leader" | "user">("admin");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoginPage onLogin={() => setIsLoggedIn(true)} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar 
              role={userRole} 
              userName="Nguyễn Văn A" 
              unitName="Công an Hà Nội"
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
