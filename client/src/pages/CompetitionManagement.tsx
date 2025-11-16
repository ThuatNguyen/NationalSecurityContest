import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Plus, Pencil, Trash2, Play, Lock, CheckCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface EvaluationPeriod {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface Cluster {
  id: string;
  name: string;
}

const statusMap = {
  draft: { label: "Nháp", color: "bg-gray-500" },
  active: { label: "Đang diễn ra", color: "bg-green-500" },
  review1: { label: "Phúc tra 1", color: "bg-blue-500" },
  review2: { label: "Phúc tra 2", color: "bg-purple-500" },
  completed: { label: "Hoàn thành", color: "bg-slate-600" },
};

export default function CompetitionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClusterDialog, setShowClusterDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriod | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    startDate: new Date(),
    endDate: new Date(),
    status: "draft",
  });

  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);

  // Fetch evaluation periods
  const { data: periods = [], isLoading } = useQuery<EvaluationPeriod[]>({
    queryKey: ["/api/evaluation-periods"],
  });

  // Fetch all clusters
  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  // Fetch clusters for a specific period
  const { data: periodClusters = [] } = useQuery<Cluster[]>({
    queryKey: [`/api/evaluation-periods/${selectedPeriod?.id}/clusters`],
    enabled: !!selectedPeriod && showClusterDialog,
  });

  // Create period mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/evaluation-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText;
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            errorDetails = '\n' + errorJson.errors.map((e: any) => 
              `• ${e.path?.join('.') || 'field'}: ${e.message}`
            ).join('\n');
          }
        } catch (e) {}
        throw new Error(errorMessage + errorDetails);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-periods"] });
      setShowCreateDialog(false);
      toast({ title: "Đã tạo kỳ thi đua thành công" });
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Create period error:", error);
      toast({ 
        title: "Lỗi tạo kỳ thi đua", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update period mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/evaluation-periods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-periods"] });
      setShowEditDialog(false);
      toast({ title: "Đã cập nhật kỳ thi đua" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  // Delete period mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/evaluation-periods/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-periods"] });
      setShowDeleteDialog(false);
      toast({ title: "Đã xóa kỳ thi đua" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  // Assign clusters mutation
  const assignClustersMutation = useMutation({
    mutationFn: async ({ periodId, clusterIds }: { periodId: string; clusterIds: string[] }) => {
      const res = await fetch(`/api/evaluation-periods/${periodId}/clusters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clusterIds }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/evaluation-periods/${selectedPeriod?.id}/clusters`] });
      setShowClusterDialog(false);
      toast({ title: "Đã gán cụm cho kỳ thi đua" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  // Initialize units mutation
  const initUnitsMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const res = await fetch(`/api/evaluation-periods/${periodId}/initialize-units`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Đã khởi tạo đơn vị",
        description: `Tạo mới: ${data.created}, Đã tồn tại: ${data.existing}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ periodId, status }: { periodId: string; status: string }) => {
      const res = await fetch(`/api/evaluation-periods/${periodId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-periods"] });
      toast({ title: "Đã cập nhật trạng thái" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      year: new Date().getFullYear(),
      startDate: new Date(),
      endDate: new Date(),
      status: "draft",
    });
  };

  const handleCreate = () => {
    // Validate form data
    if (!formData.name || !formData.year || !formData.startDate || !formData.endDate) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    const payload = {
      name: formData.name,
      year: formData.year,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      status: formData.status,
    };
    console.log("Creating period with payload:", payload);
    createMutation.mutate(payload);
  };

  const handleEdit = () => {
    if (!selectedPeriod) return;
    updateMutation.mutate({
      id: selectedPeriod.id,
      data: {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      } as any,
    });
  };

  const handleDelete = () => {
    if (!selectedPeriod) return;
    deleteMutation.mutate(selectedPeriod.id);
  };

  const handleAssignClusters = () => {
    if (!selectedPeriod) return;
    assignClustersMutation.mutate({
      periodId: selectedPeriod.id,
      clusterIds: selectedClusters,
    });
  };

  const openEditDialog = (period: EvaluationPeriod) => {
    setSelectedPeriod(period);
    setFormData({
      name: period.name,
      year: period.year,
      startDate: new Date(period.startDate),
      endDate: new Date(period.endDate),
      status: period.status,
    });
    setShowEditDialog(true);
  };

  const openClusterDialog = (period: EvaluationPeriod) => {
    setSelectedPeriod(period);
    setShowClusterDialog(true);
    // Load current clusters
    queryClient.fetchQuery({
      queryKey: [`/api/evaluation-periods/${period.id}/clusters`],
    }).then((data: any) => {
      setSelectedClusters(data.map((c: Cluster) => c.id));
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quản lý Kỳ thi đua</CardTitle>
            <CardDescription>
              Tạo và quản lý các kỳ thi đua, gán cụm, khởi tạo đơn vị
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo kỳ thi đua
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có kỳ thi đua nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên kỳ thi đua</TableHead>
                  <TableHead>Năm</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>{period.year}</TableCell>
                    <TableCell>
                      {format(new Date(period.startDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(period.endDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusMap[period.status as keyof typeof statusMap]?.color || "bg-gray-500"}>
                        {statusMap[period.status as keyof typeof statusMap]?.label || period.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/settings/competitions/${period.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(period)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openClusterDialog(period)}
                      >
                        Gán cụm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => initUnitsMutation.mutate(period.id)}
                      >
                        Khởi tạo đơn vị
                      </Button>
                      {period.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              periodId: period.id,
                              status: "active",
                            })
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {period.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              periodId: period.id,
                              status: "review1",
                            })
                          }
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      )}
                      {period.status === "review1" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              periodId: period.id,
                              status: "completed",
                            })
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo kỳ thi đua mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin kỳ thi đua. Sau khi tạo, bạn cần gán cụm và khởi tạo đơn vị.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên kỳ thi đua</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Kỳ thi đua 6 tháng đầu năm 2025"
              />
            </div>
            <div>
              <Label htmlFor="year">Năm</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Ngày bắt đầu</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(formData.startDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setFormData({ ...formData, startDate: newDate });
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                      locale={vi}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(formData.endDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setFormData({ ...formData, endDate: newDate });
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                      locale={vi}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa kỳ thi đua</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên kỳ thi đua</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-year">Năm</Label>
              <Input
                id="edit-year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Ngày bắt đầu</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(formData.startDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setFormData({ ...formData, startDate: newDate });
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                      locale={vi}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(formData.endDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setFormData({ ...formData, endDate: newDate });
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                      locale={vi}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa kỳ thi đua "{selectedPeriod?.name}"? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cluster Assignment Dialog */}
      <Dialog open={showClusterDialog} onOpenChange={setShowClusterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gán cụm cho kỳ thi đua</DialogTitle>
            <DialogDescription>
              Chọn các cụm thi đua sẽ tham gia kỳ này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {clusters.map((cluster) => (
              <div key={cluster.id} className="flex items-center space-x-2">
                <Checkbox
                  id={cluster.id}
                  checked={selectedClusters.includes(cluster.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedClusters([...selectedClusters, cluster.id]);
                    } else {
                      setSelectedClusters(selectedClusters.filter((id) => id !== cluster.id));
                    }
                  }}
                />
                <Label htmlFor={cluster.id} className="cursor-pointer">
                  {cluster.name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClusterDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleAssignClusters}>
              Lưu ({selectedClusters.length} cụm)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
