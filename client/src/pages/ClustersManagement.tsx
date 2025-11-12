import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Cluster, InsertCluster } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ClustersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [formData, setFormData] = useState<InsertCluster>({
    name: "",
    description: "",
  });
  const { toast } = useToast();

  // Fetch clusters
  const { data: clusters, isLoading } = useQuery({
    queryKey: ["/api/clusters"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCluster) => {
      return await apiRequest("POST", "/api/clusters", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      toast({ title: "Thành công", description: "Đã tạo cụm thi đua mới" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể tạo cụm thi đua",
        variant: "destructive" 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCluster> }) => {
      return await apiRequest("PUT", `/api/clusters/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      toast({ title: "Thành công", description: "Đã cập nhật cụm thi đua" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể cập nhật cụm thi đua",
        variant: "destructive" 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/clusters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      toast({ title: "Thành công", description: "Đã xóa cụm thi đua" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể xóa cụm thi đua",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCluster(null);
  };

  const handleOpenDialog = (cluster?: Cluster) => {
    if (cluster) {
      setEditingCluster(cluster);
      setFormData({
        name: cluster.name,
        description: cluster.description || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng nhập tên cụm thi đua",
        variant: "destructive" 
      });
      return;
    }

    if (editingCluster) {
      updateMutation.mutate({ id: editingCluster.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (cluster: Cluster) => {
    if (window.confirm(`Bạn có chắc muốn xóa cụm "${cluster.name}"? Tất cả đơn vị và dữ liệu liên quan sẽ bị xóa.`)) {
      deleteMutation.mutate(cluster.id);
    }
  };

  // Filter clusters
  const filteredClusters = ((clusters as Cluster[] | undefined) || []).filter((cluster: Cluster) =>
    cluster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cluster.description && cluster.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 overflow-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Cụm thi đua</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các cụm thi đua trong hệ thống
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          data-testid="button-add-cluster"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Cụm thi đua
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Danh sách Cụm thi đua</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClusters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Không tìm thấy cụm thi đua nào" : "Chưa có cụm thi đua nào"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-16">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tên cụm</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Mô tả</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClusters.map((cluster: Cluster, index: number) => (
                    <tr key={cluster.id} className="border-b hover-elevate" data-testid={`row-cluster-${cluster.id}`}>
                      <td className="px-4 py-3 text-sm text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium" data-testid={`text-name-${cluster.id}`}>
                        {cluster.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {cluster.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(cluster)}
                            data-testid={`button-edit-${cluster.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cluster)}
                            data-testid={`button-delete-${cluster.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-cluster-form">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCluster ? "Sửa Cụm thi đua" : "Thêm Cụm thi đua mới"}
              </DialogTitle>
              <DialogDescription>
                {editingCluster 
                  ? "Cập nhật thông tin cụm thi đua" 
                  : "Nhập thông tin cụm thi đua mới"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên cụm thi đua <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Cụm Công an quận 1"
                  disabled={isPending}
                  data-testid="input-cluster-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về cụm thi đua (tùy chọn)"
                  disabled={isPending}
                  rows={3}
                  data-testid="input-cluster-description"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCluster ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
