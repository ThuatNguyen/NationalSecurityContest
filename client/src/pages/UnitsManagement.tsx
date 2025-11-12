import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Unit, InsertUnit, Cluster } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UnitsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<InsertUnit>({
    name: "",
    clusterId: "",
    description: "",
  });
  const { toast } = useToast();

  // Fetch clusters for dropdown
  const { data: clusters } = useQuery({
    queryKey: ["/api/clusters"],
  });

  // Fetch units (filtered by selected cluster)
  const { data: units, isLoading } = useQuery({
    queryKey: ["/api/units", selectedCluster],
    queryFn: async () => {
      const url = selectedCluster 
        ? `/api/units?clusterId=${selectedCluster}`
        : "/api/units";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch units");
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertUnit) => {
      return await apiRequest("POST", "/api/units", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Thành công", description: "Đã tạo đơn vị mới" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể tạo đơn vị",
        variant: "destructive" 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUnit> }) => {
      return await apiRequest("PUT", `/api/units/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Thành công", description: "Đã cập nhật đơn vị" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể cập nhật đơn vị",
        variant: "destructive" 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Thành công", description: "Đã xóa đơn vị" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể xóa đơn vị",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", clusterId: "", description: "" });
    setEditingUnit(null);
  };

  const handleOpenDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        clusterId: unit.clusterId,
        description: unit.description || "",
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
        description: "Vui lòng nhập tên đơn vị",
        variant: "destructive" 
      });
      return;
    }

    if (!formData.clusterId) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng chọn cụm thi đua",
        variant: "destructive" 
      });
      return;
    }

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (unit: Unit) => {
    if (window.confirm(`Bạn có chắc muốn xóa đơn vị "${unit.name}"?`)) {
      deleteMutation.mutate(unit.id);
    }
  };

  // Get cluster name by ID
  const getClusterName = (clusterId: string) => {
    const cluster = (clusters as Cluster[] | undefined)?.find(c => c.id === clusterId);
    return cluster?.name || "—";
  };

  // Filter units by search term
  const filteredUnits = ((units as Unit[] | undefined) || []).filter((unit: Unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    getClusterName(unit.clusterId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 overflow-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Đơn vị</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các đơn vị thi đua trong hệ thống
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          data-testid="button-add-unit"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Đơn vị
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Danh sách Đơn vị</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Cluster filter */}
              <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                <SelectTrigger className="w-64" data-testid="select-cluster-filter">
                  <SelectValue placeholder="Tất cả cụm thi đua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" data-testid="option-all-clusters">Tất cả cụm thi đua</SelectItem>
                  {((clusters as Cluster[] | undefined) || []).map((cluster: Cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id} data-testid={`option-cluster-${cluster.id}`}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Search */}
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || selectedCluster ? "Không tìm thấy đơn vị nào" : "Chưa có đơn vị nào"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-16">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tên đơn vị</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Cụm thi đua</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Mô tả</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit: Unit, index: number) => (
                    <tr key={unit.id} className="border-b hover-elevate" data-testid={`row-unit-${unit.id}`}>
                      <td className="px-4 py-3 text-sm text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium" data-testid={`text-name-${unit.id}`}>
                        {unit.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {getClusterName(unit.clusterId)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {unit.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(unit)}
                            data-testid={`button-edit-${unit.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(unit)}
                            data-testid={`button-delete-${unit.id}`}
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
        <DialogContent data-testid="dialog-unit-form">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "Sửa Đơn vị" : "Thêm Đơn vị mới"}
              </DialogTitle>
              <DialogDescription>
                {editingUnit 
                  ? "Cập nhật thông tin đơn vị" 
                  : "Nhập thông tin đơn vị mới"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên đơn vị <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Công an phường Đống Đa"
                  disabled={isPending}
                  data-testid="input-unit-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clusterId">
                  Cụm thi đua <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.clusterId} 
                  onValueChange={(value) => setFormData({ ...formData, clusterId: value })}
                  disabled={isPending}
                >
                  <SelectTrigger id="clusterId" data-testid="select-cluster">
                    <SelectValue placeholder="Chọn cụm thi đua" />
                  </SelectTrigger>
                  <SelectContent>
                    {((clusters as Cluster[] | undefined) || []).map((cluster: Cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id} data-testid={`option-cluster-form-${cluster.id}`}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về đơn vị (tùy chọn)"
                  disabled={isPending}
                  rows={3}
                  data-testid="input-unit-description"
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
                {editingUnit ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
