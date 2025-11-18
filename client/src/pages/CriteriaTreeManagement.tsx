import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CriteriaTreeView } from "@/components/CriteriaTreeView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, X } from "lucide-react";
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
import type { CriteriaWithChildren, InsertCriteria } from "@shared/schema";

export default function CriteriaManagementPage() {
  const { toast } = useToast();
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedClusterId, setSelectedClusterId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<CriteriaWithChildren | null>(null);
  const [parentCriteria, setParentCriteria] = useState<CriteriaWithChildren | null>(null);
  
  // Fetch all evaluation periods (active ones will be at the top)
  const { data: allPeriods = [] } = useQuery({
    queryKey: ["/api/evaluation-periods"],
    queryFn: async () => {
      const response = await fetch("/api/evaluation-periods");
      if (!response.ok) throw new Error("Failed to fetch periods");
      return response.json();
    }
  });
  
  // Filter to show active periods first
  const periods = allPeriods.filter((p: any) => p.status === "active").concat(
    allPeriods.filter((p: any) => p.status !== "active")
  );
  
  // Fetch clusters assigned to the selected period
  const { data: clusters = [] } = useQuery({
    queryKey: ["/api/evaluation-periods", selectedPeriodId, "clusters"],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation-periods/${selectedPeriodId}/clusters`);
      if (!response.ok) throw new Error("Failed to fetch clusters");
      return response.json();
    },
    enabled: !!selectedPeriodId
  });
  
  // Auto-select first period when periods load
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);
  
  // Reset cluster and auto-select first cluster when period changes or clusters load
  useEffect(() => {
    if (clusters.length > 0) {
      setSelectedClusterId(clusters[0].id);
    } else {
      setSelectedClusterId("");
    }
  }, [selectedPeriodId, clusters]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    maxScore: "0",
    criteriaType: 1,
    formulaType: 1,
    orderIndex: 0,
    clusterId: "",
    isLeaf: false, // New: to determine if this is a leaf criteria
    // Details for different types
    targetRequired: 1,
    defaultTarget: "",
    unit: "",
    pointPerUnit: "",
    maxScoreLimit: "",
    bonusPoint: "",
    penaltyPoint: "",
    minScore: "",
    maxScoreBonus: ""
  });
  
  // Fetch criteria tree
  const { data: tree = [], isLoading, refetch } = useQuery<CriteriaWithChildren[]>({
    queryKey: ["/api/criteria/tree", selectedPeriodId, selectedClusterId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("periodId", selectedPeriodId);
      if (selectedClusterId) {
        params.append("clusterId", selectedClusterId);
      }
      const response = await fetch(`/api/criteria/tree?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch criteria tree");
      return response.json();
    },
    enabled: !!selectedClusterId && !!selectedPeriodId // Only fetch when both cluster and period are selected
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { criteria: InsertCriteria; details?: any }) => {
      return await apiRequest("POST", "/api/criteria", data);
    },
    onSuccess: () => {
      refetch(); // Refetch instead of invalidate to ensure fresh data
      toast({ title: "Thành công", description: "Đã tạo tiêu chí mới" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể tạo tiêu chí",
        variant: "destructive" 
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { criteria: Partial<InsertCriteria>; details?: any } }) => {
      return await apiRequest("PUT", `/api/criteria/${id}`, data);
    },
    onSuccess: () => {
      refetch(); // Refetch instead of invalidate
      toast({ title: "Thành công", description: "Đã cập nhật tiêu chí" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể cập nhật tiêu chí",
        variant: "destructive" 
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/criteria/${id}`);
    },
    onSuccess: () => {
      refetch(); // Refetch instead of invalidate
      toast({ title: "Thành công", description: "Đã xóa tiêu chí" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể xóa tiêu chí",
        variant: "destructive" 
      });
    },
  });
  
  const openCreateDialog = (parent?: CriteriaWithChildren) => {
    setEditingCriteria(null);
    setParentCriteria(parent || null);
    setFormData({
      name: "",
      code: "",
      description: "",
      maxScore: "0",
      criteriaType: 1,
      formulaType: 1,
      orderIndex: 0,
      clusterId: selectedClusterId || "",
      isLeaf: false,
      targetRequired: 1,
      defaultTarget: "",
      unit: "",
      pointPerUnit: "",
      maxScoreLimit: "",
      bonusPoint: "",
      penaltyPoint: "",
      minScore: "",
      maxScoreBonus: ""
    });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (criteria: CriteriaWithChildren) => {
    setEditingCriteria(criteria);
    setParentCriteria(null);
    const hasChildren = criteria.children && criteria.children.length > 0;
    setFormData({
      name: criteria.name,
      code: criteria.code || "",
      description: criteria.description || "",
      maxScore: criteria.maxScore?.toString() || "0",
      criteriaType: criteria.criteriaType,
      formulaType: criteria.formulaType || 1,
      orderIndex: criteria.orderIndex,
      clusterId: criteria.clusterId || "",
      isLeaf: !hasChildren && criteria.criteriaType > 0, // Is leaf if has no children and has a type
      targetRequired: 1,
      defaultTarget: "",
      unit: "",
      pointPerUnit: "",
      maxScoreLimit: "",
      bonusPoint: "",
      penaltyPoint: "",
      minScore: "",
      maxScoreBonus: ""
    });
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCriteria(null);
    setParentCriteria(null);
  };
  
  const handleSubmit = () => {
    // Simplified: Only store criteriaType and maxScore
    const criteria: InsertCriteria = {
      name: formData.name,
      code: formData.code || undefined,
      description: formData.description || undefined,
      parentId: parentCriteria?.id || editingCriteria?.parentId || null,
      level: parentCriteria ? parentCriteria.level + 1 : 1,
      maxScore: formData.maxScore,
      criteriaType: formData.isLeaf ? formData.criteriaType : 0, // 0 means parent node, no scoring
      formulaType: undefined, // No longer needed - calculation logic is in backend
      orderIndex: formData.orderIndex,
      periodId: selectedPeriodId,
      clusterId: formData.clusterId || selectedClusterId,
      isActive: 1
    };
    
    // No more complex details - simplified approach
    if (editingCriteria) {
      updateMutation.mutate({ 
        id: editingCriteria.id, 
        data: { criteria, details: undefined }
      });
    } else {
      createMutation.mutate({ criteria, details: undefined });
    }
  };
  
  const handleDelete = (criteria: CriteriaWithChildren) => {
    if (confirm(`Bạn có chắc muốn xóa tiêu chí "${criteria.name}"?`)) {
      deleteMutation.mutate(criteria.id);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý Tiêu chí thi đua (Tree Structure)</CardTitle>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm tiêu chí gốc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="w-64">
              <Label>Kỳ thi đua</Label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId} data-testid="select-period">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỳ thi đua..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period: any) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} {period.status === "active" && "✓"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-64">
              <Label>Cụm thi đua</Label>
              <Select value={selectedClusterId} onValueChange={setSelectedClusterId} data-testid="select-cluster">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cụm..." />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster: any) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tree view */}
          {isLoading ? (
            <div className="text-center py-12">Đang tải...</div>
          ) : (
            <CriteriaTreeView
              tree={tree}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddChild={openCreateDialog}
              isEditable={true}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCriteria ? "Sửa tiêu chí" : parentCriteria ? `Thêm tiêu chí con cho "${parentCriteria.name}"` : "Thêm tiêu chí gốc"}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ thông tin tiêu chí
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Mã tiêu chí</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: I, II, 1.1, 1.2.3"
                />
              </div>
              
              <div>
                <Label htmlFor="orderIndex">Thứ tự</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">Tên tiêu chí *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Công tác phòng chống tội phạm"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            {/* Checkbox for leaf criteria */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isLeaf"
                checked={formData.isLeaf}
                onChange={(e) => setFormData({ ...formData, isLeaf: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                data-testid="checkbox-is-leaf"
              />
              <Label htmlFor="isLeaf" className="cursor-pointer">
                Đây là tiêu chí lá (có thể chấm điểm trực tiếp)
              </Label>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              {formData.isLeaf 
                ? "✓ Tiêu chí này sẽ được chấm điểm trực tiếp. Vui lòng chọn loại và nhập điểm tối đa."
                : "ℹ️ Tiêu chí cha (không lá) sẽ tự động tính điểm từ tổng các tiêu chí con."}
            </p>
            
            {/* Simplified form for leaf criteria - only criteriaType and maxScore */}
            {formData.isLeaf ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="criteriaType">Loại tiêu chí *</Label>
                  <Select 
                    value={formData.criteriaType.toString()} 
                    onValueChange={(v) => setFormData({ ...formData, criteriaType: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-criteria-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Định lượng</SelectItem>
                      <SelectItem value="2">Định tính</SelectItem>
                      <SelectItem value="3">Chấm thẳng</SelectItem>
                      <SelectItem value="4">Cộng/Trừ điểm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="maxScore">Điểm tối đa *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    step="0.01"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                    data-testid="input-max-score"
                  />
                </div>
                
                {/* Help text explaining each criteria type */}
                {formData.criteriaType === 1 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Tiêu chí định lượng</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Người dùng nhập <strong>giá trị thực tế đạt được</strong>, hệ thống tự động tính điểm dựa trên chỉ tiêu đã giao.
                    </p>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <div><strong>Công thức tính:</strong> Điểm = (Giá trị đạt được / Chỉ tiêu) × Điểm tối đa</div>
                      <div className="pl-4">
                        <div>• Ví dụ: Chỉ tiêu 100 vụ, đạt 80 vụ → 80% → Được {(0.8 * parseFloat(formData.maxScore || '0')).toFixed(2)}/{formData.maxScore} điểm</div>
                        <div>• Ví dụ: Chỉ tiêu 100 vụ, đạt 120 vụ → 120% → Được {(1.2 * parseFloat(formData.maxScore || '0')).toFixed(2)} điểm <strong>(vượt chỉ tiêu!)</strong></div>
                        <div>• Điểm có thể vượt mức tối đa nếu hoàn thành vượt chỉ tiêu</div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                      Lưu ý: Admin cần giao chỉ tiêu cho từng đơn vị trước khi chấm điểm
                    </p>
                  </div>
                )}
                
                {formData.criteriaType === 2 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Tiêu chí định tính</h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Người dùng chỉ cần chọn <strong>Đạt</strong> hoặc <strong>Không đạt</strong>, hệ thống tự động tính điểm.
                    </p>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <div>• Đạt → Nhận điểm tối đa: <strong>{formData.maxScore} điểm</strong></div>
                      <div>• Không đạt → <strong>0 điểm</strong></div>
                    </div>
                  </div>
                )}
                
                {formData.criteriaType === 3 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg space-y-2">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">Tiêu chí chấm thẳng</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Người dùng tự nhập điểm và có thể đính kèm file minh chứng.
                    </p>
                    <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      <div>• Điểm nhập vào: từ 0 đến {formData.maxScore} điểm</div>
                      <div>• Có thể upload file đính kèm (PDF, hình ảnh, v.v.)</div>
                      <div>• Ví dụ: Hoàn thành xuất sắc nhiệm vụ A → Tự chấm 9/{formData.maxScore} điểm</div>
                    </div>
                  </div>
                )}
                
                {formData.criteriaType === 4 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg space-y-2">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100">Tiêu chí cộng/trừ điểm</h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Người dùng tự nhập điểm (có thể âm) và có thể đính kèm file minh chứng.
                    </p>
                    <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <div>• Điểm cộng: giá trị dương (VD: +5 điểm)</div>
                      <div>• Điểm trừ: giá trị âm (VD: -3 điểm)</div>
                      <div>• Có thể upload file đính kèm minh chứng</div>
                      <div>• Ví dụ: Sáng kiến được khen thưởng → +{formData.maxScore} điểm</div>
                      <div>• Ví dụ: Vi phạm kỷ luật → -{formData.maxScore} điểm</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="maxScore">Điểm tối đa *</Label>
                <Input
                  id="maxScore"
                  type="number"
                  step="0.01"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  data-testid="input-max-score"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Điểm tối đa của tiêu chí cha sẽ bằng tổng điểm các tiêu chí con
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              <Save className="w-4 h-4 mr-2" />
              {editingCriteria ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
