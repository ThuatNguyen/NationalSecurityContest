import { useSession } from "@/lib/useSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("admin" | "cluster_leader" | "user")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useSession();

  if (!user) {
    return null;
  }

  const userRole = user.role as "admin" | "cluster_leader" | "user";

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Không có quyền truy cập</CardTitle>
            <CardDescription>
              Bạn không có quyền truy cập vào trang này
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Chức năng này chỉ dành cho: {allowedRoles.map(role => {
                if (role === "admin") return "Quản trị viên";
                if (role === "cluster_leader") return "Cụm trưởng";
                return "Người dùng";
              }).join(", ")}
            </p>
            <Button asChild>
              <Link href="/">Về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
