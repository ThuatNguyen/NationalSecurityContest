import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Info } from "lucide-react";
import { useState, useEffect } from "react";
import RoleBadge from "@/components/RoleBadge";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "cluster_leader" | "user";
  clusterId: string | null;
  unitId: string | null;
  createdAt: string;
}

interface Cluster {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  clusterId: string;
}

export default function UsersManagement() {
  const { user: currentUser } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "user" as "admin" | "cluster_leader" | "user",
    clusterId: "",
    unitId: "",
  });
  const { toast } = useToast();

  // Auto-set cluster for cluster_leader when creating new user
  useEffect(() => {
    if (currentUser?.role === "cluster_leader" && currentUser.clusterId && !selectedUser) {
      setFormData(prev => ({ ...prev, clusterId: currentUser.clusterId || "" }));
    }
  }, [currentUser, selectedUser]);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users', currentUser?.clusterId],
    queryFn: async () => {
      const url = currentUser?.role === "cluster_leader" && currentUser.clusterId
        ? `/api/users?clusterId=${currentUser.clusterId}`
        : '/api/users';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ['/api/clusters'],
  });

  const { data: allUnits = [] } = useQuery<Unit[]>({
    queryKey: ['/api/units'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setFormOpen(false);
      resetForm();
      toast({ title: "Thành công", description: "Đã thêm người dùng mới" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể thêm người dùng", 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/users/${data.id}`, data.updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setFormOpen(false);
      resetForm();
      toast({ title: "Thành công", description: "Đã cập nhật người dùng" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể cập nhật người dùng", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "Thành công", description: "Đã xóa người dùng" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể xóa người dùng", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user",
      clusterId: "",
      unitId: "",
    });
    setSelectedUser(null);
  };

  const handleAdd = () => {
    resetForm();
    // Auto-set cluster for cluster_leader when creating new user
    if (currentUser?.role === "cluster_leader" && currentUser.clusterId) {
      setFormData(prev => ({ ...prev, clusterId: currentUser.clusterId || "" }));
    }
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      confirmPassword: "",
      fullName: user.fullName,
      role: user.role,
      clusterId: user.clusterId || "",
      unitId: user.unitId || "",
    });
    setFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser && formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUser && formData.password.length < 8) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 8 ký tự",
        variant: "destructive",
      });
      return;
    }

    if (selectedUser && formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    // Role-based validation for clusterId and unitId
    if (formData.role === "admin") {
      if (formData.clusterId || formData.unitId) {
        toast({
          title: "Lỗi",
          description: "Quản trị viên không được gán vào cụm hoặc đơn vị",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.role === "cluster_leader") {
      if (!formData.clusterId) {
        toast({
          title: "Lỗi",
          description: "Cụm trưởng phải được gán vào một cụm",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.role === "user") {
      if (!formData.unitId) {
        toast({
          title: "Lỗi",
          description: "Người dùng đơn vị phải được gán vào một đơn vị",
          variant: "destructive",
        });
        return;
      }
    }

    const submitData: any = {
      username: formData.username,
      fullName: formData.fullName,
      role: formData.role,
      clusterId: formData.clusterId || null,
      unitId: formData.unitId || null,
    };

    if (!selectedUser || formData.password) {
      submitData.password = formData.password;
    }

    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, updates: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableUnits = formData.clusterId
    ? allUnits.filter(u => u.clusterId === formData.clusterId)
    : allUnits;

  return (
    <div className="space-y-6">
      {currentUser?.role === "cluster_leader" && currentUser.clusterId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Bạn đang quản lý người dùng trong cụm: <strong>{clusters.find(c => c.id === currentUser.clusterId)?.name}</strong>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Quản lý người dùng</CardTitle>
              <CardDescription>Quản lý tài khoản người dùng và phân quyền</CardDescription>
            </div>
            <Button onClick={handleAdd} data-testid="button-add-user">
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>

          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Cụm/Đơn vị</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const cluster = clusters.find(c => c.id === user.clusterId);
                    const unit = allUnits.find(u => u.id === user.unitId);
                    return (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cluster?.name || unit?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                              data-testid={`button-edit-${user.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy người dùng
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Sửa người dùng" : "Thêm người dùng mới"}</DialogTitle>
            <DialogDescription>
              {selectedUser ? "Cập nhật thông tin người dùng" : "Tạo tài khoản người dùng mới"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                data-testid="input-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu {selectedUser ? "(để trống nếu không đổi)" : "*"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedUser}
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Xác nhận mật khẩu {selectedUser && !formData.password ? "" : "*"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!selectedUser || !!formData.password}
                data-testid="input-confirm-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "cluster_leader" | "user") => {
                  // Reset clusterId and unitId when changing role
                  setFormData({ 
                    ...formData, 
                    role: value,
                    clusterId: value === "admin" ? "" : formData.clusterId,
                    unitId: value === "admin" || value === "cluster_leader" ? "" : formData.unitId
                  });
                }}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="cluster_leader">Cụm trưởng</SelectItem>
                  <SelectItem value="user">Người dùng</SelectItem>
                </SelectContent>
              </Select>
              {formData.role === "admin" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Quản trị viên có quyền truy cập toàn bộ hệ thống
                </p>
              )}
              {formData.role === "cluster_leader" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cụm trưởng chỉ quản lý các đơn vị trong cụm được gán
                </p>
              )}
              {formData.role === "user" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Người dùng đơn vị chỉ thao tác với dữ liệu của đơn vị được gán
                </p>
              )}
            </div>
            {formData.role === "cluster_leader" && (
              <div className="space-y-2">
                <Label htmlFor="cluster">
                  Cụm * {currentUser?.role === "cluster_leader" && "(Tự động chọn cụm của bạn)"}
                </Label>
                <Select
                  value={formData.clusterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clusterId: value })
                  }
                  disabled={currentUser?.role === "cluster_leader"}
                >
                  <SelectTrigger data-testid="select-cluster">
                    <SelectValue placeholder="Chọn cụm..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.role === "user" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cluster">Cụm</Label>
                  <Select
                    value={formData.clusterId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clusterId: value, unitId: "" })
                    }
                  >
                    <SelectTrigger data-testid="select-cluster">
                      <SelectValue placeholder="Chọn cụm..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Chọn cụm để lọc danh sách đơn vị</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Đơn vị *</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                    disabled={!formData.clusterId}
                  >
                    <SelectTrigger data-testid="select-unit">
                      <SelectValue placeholder="Chọn đơn vị..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Đang xử lý..."
                  : selectedUser
                  ? "Cập nhật"
                  : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa người dùng <strong>{selectedUser?.fullName}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
