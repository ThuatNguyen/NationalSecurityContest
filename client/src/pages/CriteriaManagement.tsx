import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Edit, Trash2, Plus, FolderPlus, Info } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/useSession";
import type { Cluster, CriteriaGroup, Criteria } from "@shared/schema";

export default function CriteriaManagement() {
  const { user } = useSession();
  const { toast } = useToast();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedClusterId, setSelectedClusterId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CriteriaGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: "",
    displayOrder: 1,
  });
  
  // Criteria dialog state
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria | null>(null);
  const [criteriaFormData, setCriteriaFormData] = useState({
    name: "",
    groupId: "",
    maxScore: "",
    displayOrder: 1,
  });
  
  // Delete dialogs
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [deleteCriteriaDialogOpen, setDeleteCriteriaDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Auto-select cluster for cluster_leader
  useEffect(() => {
    if (user?.role === "cluster_leader" && user.clusterId && !selectedClusterId) {
      setSelectedClusterId(user.clusterId);
    }
  }, [user, selectedClusterId]);

  const { data: clusters, isLoading: clustersLoading } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  // Fetch evaluation periods based on cluster
  const { data: periods = [] } = useQuery({
    queryKey: ["/api/evaluation-periods", selectedClusterId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClusterId) {
        params.append("clusterId", selectedClusterId);
      }
      const response = await fetch(`/api/evaluation-periods?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch periods");
      return response.json();
    },
    enabled: !!selectedClusterId
  });
  
  // Auto-select first period
  useEffect(() => {
    if (periods.length > 0) {
      setSelectedPeriodId(periods[0].id);
    } else {
      setSelectedPeriodId("");
    }
  }, [periods]);

  const { data: criteriaGroups, isLoading: groupsLoading } = useQuery<CriteriaGroup[]>({
    queryKey: ["/api/criteria-groups", selectedClusterId, selectedPeriodId],
    enabled: !!selectedClusterId && !!selectedPeriodId,
    queryFn: async () => {
      const res = await fetch(`/api/criteria-groups?clusterId=${selectedClusterId}&periodId=${selectedPeriodId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return await res.json();
    },
  });

  const { data: allCriteria, isLoading: criteriaLoading } = useQuery<Criteria[]>({
    queryKey: ["/api/criteria/all", criteriaGroups?.map(g => g.id)],
    enabled: !!criteriaGroups && criteriaGroups.length > 0,
    queryFn: async () => {
      if (!criteriaGroups || criteriaGroups.length === 0) return [];
      const results = await Promise.all(
        criteriaGroups.map(group => 
          fetch(`/api/criteria?groupId=${group.id}`, { credentials: "include" }).then(res => res.json())
        )
      );
      return results.flat();
    },
  });

  // Mutations for criteria groups
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/criteria-groups', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/criteria/all"] });
      setGroupDialogOpen(false);
      resetGroupForm();
      toast({ title: "Thành công", description: "Đã thêm nhóm tiêu chí" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể thêm nhóm tiêu chí", variant: "destructive" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/criteria-groups/${data.id}`, data.updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/criteria/all"] });
      setGroupDialogOpen(false);
      resetGroupForm();
      toast({ title: "Thành công", description: "Đã cập nhật nhóm tiêu chí" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể cập nhật nhóm tiêu chí", variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/criteria-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/criteria/all"] });
      setDeleteGroupDialogOpen(false);
      setItemToDelete(null);
      toast({ title: "Thành công", description: "Đã xóa nhóm tiêu chí" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể xóa nhóm tiêu chí", variant: "destructive" });
    },
  });

  // Mutations for criteria
  const createCriteriaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/criteria', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria/all"] });
      setCriteriaDialogOpen(false);
      resetCriteriaForm();
      toast({ title: "Thành công", description: "Đã thêm tiêu chí" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể thêm tiêu chí", variant: "destructive" });
    },
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/criteria/${data.id}`, data.updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria/all"] });
      setCriteriaDialogOpen(false);
      resetCriteriaForm();
      toast({ title: "Thành công", description: "Đã cập nhật tiêu chí" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể cập nhật tiêu chí", variant: "destructive" });
    },
  });

  const deleteCriteriaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/criteria/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria/all"] });
      setDeleteCriteriaDialogOpen(false);
      setItemToDelete(null);
      toast({ title: "Thành công", description: "Đã xóa tiêu chí" });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message || "Không thể xóa tiêu chí", variant: "destructive" });
    },
  });

  const resetGroupForm = () => {
    setGroupFormData({ name: "", displayOrder: 1 });
    setSelectedGroup(null);
  };

  const resetCriteriaForm = () => {
    setCriteriaFormData({ name: "", groupId: "", maxScore: "", displayOrder: 1 });
    setSelectedCriteria(null);
  };

  const handleAddGroup = () => {
    resetGroupForm();
    const nextOrder = (criteriaGroups?.length || 0) + 1;
    setGroupFormData({ name: "", displayOrder: nextOrder });
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: CriteriaGroup) => {
    setSelectedGroup(group);
    setGroupFormData({
      name: group.name,
      displayOrder: group.displayOrder,
    });
    setGroupDialogOpen(true);
  };

  const handleDeleteGroup = (group: CriteriaGroup) => {
    setItemToDelete(group);
    setDeleteGroupDialogOpen(true);
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      name: groupFormData.name,
      displayOrder: groupFormData.displayOrder,
      periodId: selectedPeriodId,
      clusterId: selectedClusterId,
    };

    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, updates: submitData });
    } else {
      createGroupMutation.mutate(submitData);
    }
  };

  const handleAddCriteria = (groupId?: string) => {
    resetCriteriaForm();
    const group = groupId ? criteriaGroups?.find(g => g.id === groupId) : null;
    const criteriaInGroup = allCriteria?.filter(c => c.groupId === groupId) || [];
    const nextOrder = criteriaInGroup.length + 1;
    
    setCriteriaFormData({
      name: "",
      groupId: groupId || "",
      maxScore: "",
      displayOrder: nextOrder,
    });
    setCriteriaDialogOpen(true);
  };

  const handleEditCriteria = (criteria: Criteria) => {
    setSelectedCriteria(criteria);
    setCriteriaFormData({
      name: criteria.name,
      groupId: criteria.groupId,
      maxScore: criteria.maxScore,
      displayOrder: criteria.displayOrder,
    });
    setCriteriaDialogOpen(true);
  };

  const handleDeleteCriteria = (criteria: Criteria) => {
    setItemToDelete(criteria);
    setDeleteCriteriaDialogOpen(true);
  };

  const handleSubmitCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!criteriaFormData.groupId) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng chọn nhóm tiêu chí", 
        variant: "destructive" 
      });
      return;
    }
    
    const maxScore = parseFloat(criteriaFormData.maxScore);
    if (isNaN(maxScore) || maxScore < 0) {
      toast({ 
        title: "Lỗi", 
        description: "Điểm tối đa phải là số hợp lệ và không âm", 
        variant: "destructive" 
      });
      return;
    }
    
    const submitData = {
      name: criteriaFormData.name,
      groupId: criteriaFormData.groupId,
      maxScore: maxScore.toString(),
      displayOrder: criteriaFormData.displayOrder,
    };

    if (selectedCriteria) {
      updateCriteriaMutation.mutate({ id: selectedCriteria.id, updates: submitData });
    } else {
      createCriteriaMutation.mutate(submitData);
    }
  };

  // Initialize with all groups first (so empty groups appear)
  const groupedCriteria = (criteriaGroups || []).reduce((acc, group) => {
    acc[group.name] = { group, items: [] };
    return acc;
  }, {} as Record<string, { group: CriteriaGroup; items: Criteria[] }>);

  // Then populate criteria into groups
  (allCriteria || []).forEach(criteria => {
    const group = criteriaGroups?.find(g => g.id === criteria.groupId);
    if (group && groupedCriteria[group.name]) {
      groupedCriteria[group.name].items.push(criteria);
    }
  });

  const filteredGroupedCriteria = Object.entries(groupedCriteria).reduce((acc, [groupName, data]) => {
    const filteredItems = data.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Include group if it has matching criteria OR if it's empty (no search filtering needed for empty groups)
    if (filteredItems.length > 0 || data.items.length === 0) {
      acc[groupName] = { ...data, items: filteredItems };
    }
    return acc;
  }, {} as Record<string, { group: CriteriaGroup; items: Criteria[] }>);

  const calculateGroupTotal = (items: Criteria[]) => {
    return items.reduce((sum, item) => sum + parseFloat(item.maxScore), 0);
  };

  const isLoading = clustersLoading || groupsLoading || criteriaLoading;
  const totalCriteria = allCriteria?.length || 0;
  const canManage = user?.role === "admin" || user?.role === "cluster_leader";
  const isClusterSelected = !!selectedClusterId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tiêu chí thi đua</h1>
        <p className="text-muted-foreground mt-1">Cấu hình tiêu chí cho từng cụm thi đua</p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          {user?.role === "cluster_leader" && selectedClusterId && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Bạn đang xem dữ liệu cụm: <strong>{clusters?.find(c => c.id === selectedClusterId)?.name}</strong>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filter-cluster-criteria" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
                Cụm thi đua {user?.role === "cluster_leader" && "(Cụm của bạn)"}
              </Label>
              <Select 
                value={selectedClusterId} 
                onValueChange={setSelectedClusterId}
                disabled={clustersLoading || user?.role === "cluster_leader"}
              >
                <SelectTrigger id="filter-cluster-criteria" data-testid="select-cluster-criteria">
                  <SelectValue placeholder={clustersLoading ? "Đang tải..." : "Chọn cụm"} />
                </SelectTrigger>
                <SelectContent>
                  {clusters?.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filter-period-criteria" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
                Kỳ thi đua
              </Label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger id="filter-period-criteria" data-testid="select-period-criteria">
                  <SelectValue placeholder="Chọn kỳ thi đua" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period: any) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {canManage && !isClusterSelected && (
        <Alert data-testid="alert-select-cluster">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vui lòng chọn <strong>Cụm thi đua</strong> từ bộ lọc phía trên để bắt đầu quản lý tiêu chí
          </AlertDescription>
        </Alert>
      )}

      {canManage && (
        <div className="flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  onClick={handleAddGroup} 
                  disabled={!isClusterSelected}
                  data-testid="button-add-group"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Thêm nhóm tiêu chí
                </Button>
              </div>
            </TooltipTrigger>
            {!isClusterSelected && (
              <TooltipContent>
                <p>Chọn cụm thi đua để bật chức năng quản lý</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  onClick={() => handleAddCriteria()} 
                  disabled={!isClusterSelected || !criteriaGroups || criteriaGroups.length === 0}
                  data-testid="button-add-criteria"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm tiêu chí
                </Button>
              </div>
            </TooltipTrigger>
            {!isClusterSelected ? (
              <TooltipContent>
                <p>Chọn cụm thi đua để bật chức năng quản lý</p>
              </TooltipContent>
            ) : (!criteriaGroups || criteriaGroups.length === 0) && (
              <TooltipContent>
                <p>Tạo nhóm tiêu chí trước khi thêm tiêu chí</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Danh sách tiêu chí</h2>
          <Input
            type="search"
            placeholder="Tìm kiếm tiêu chí..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {!isClusterSelected ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>Vui lòng chọn cụm thi đua để xem danh sách tiêu chí</p>
          </Card>
        ) : isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>Đang tải dữ liệu...</p>
          </Card>
        ) : Object.keys(filteredGroupedCriteria).length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>Chưa có tiêu chí nào cho cụm thi đua này</p>
            {canManage && (
              <Button onClick={handleAddGroup} className="mt-4" data-testid="button-add-group-empty">
                <FolderPlus className="w-4 h-4 mr-2" />
                Thêm nhóm tiêu chí đầu tiên
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-12">STT</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[400px]">Tên tiêu chí</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Điểm tối đa</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(filteredGroupedCriteria).map(([groupName, data], groupIndex) => {
                      const { group, items } = data;
                      const groupTotal = calculateGroupTotal(items);
                      let itemCounter = 0;

                      return (
                        <React.Fragment key={group.id}>
                          <tr className="bg-accent/50">
                            <td colSpan={2} className="px-4 py-2 font-semibold text-sm">
                              {groupName}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-sm">
                              {groupTotal.toFixed(1)}
                            </td>
                            <td className="px-4 py-2">
                              {canManage && (
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAddCriteria(group.id)}
                                    title="Thêm tiêu chí vào nhóm này"
                                    data-testid={`button-add-criteria-${group.id}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditGroup(group)}
                                    data-testid={`button-edit-group-${group.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteGroup(group)}
                                    data-testid={`button-delete-group-${group.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {items.map((item) => {
                            itemCounter++;
                            return (
                              <tr key={item.id} className="border-b hover-elevate" data-testid={`row-criteria-${item.id}`}>
                                <td className="px-4 py-3 text-sm text-center">{itemCounter}</td>
                                <td className="px-4 py-3 text-sm pl-8">{item.name}</td>
                                <td className="px-4 py-3 text-sm text-center font-medium" data-testid={`text-maxscore-${item.id}`}>
                                  {parseFloat(item.maxScore).toFixed(1)}
                                </td>
                                <td className="px-4 py-3">
                                  {canManage && (
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditCriteria(item)}
                                        data-testid={`button-edit-${item.id}`}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCriteria(item)}
                                        data-testid={`button-delete-${item.id}`}
                                      >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {items.length === 0 && (
                            <tr className="border-b">
                              <td colSpan={4} className="px-4 py-3 text-sm text-muted-foreground text-center italic">
                                Chưa có tiêu chí trong nhóm này
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr className="bg-muted font-bold">
                      <td colSpan={2} className="px-4 py-3 text-sm">TỔNG CỘNG</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {(allCriteria || []).reduce((sum, c) => sum + parseFloat(c.maxScore), 0).toFixed(1)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>Hiển thị {totalCriteria} tiêu chí</p>
            </div>
          </>
        )}
      </div>

      {/* Criteria Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGroup ? "Sửa nhóm tiêu chí" : "Thêm nhóm tiêu chí mới"}</DialogTitle>
            <DialogDescription>
              {selectedGroup ? "Cập nhật thông tin nhóm tiêu chí" : "Tạo nhóm tiêu chí mới"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Tên nhóm tiêu chí *</Label>
              <Input
                id="group-name"
                value={groupFormData.name}
                onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                required
                data-testid="input-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-order">Thứ tự hiển thị *</Label>
              <Input
                id="group-order"
                type="number"
                min="1"
                value={groupFormData.displayOrder}
                onChange={(e) => setGroupFormData({ ...groupFormData, displayOrder: parseInt(e.target.value) })}
                required
                data-testid="input-group-order"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)} data-testid="button-cancel-group">
                Hủy
              </Button>
              <Button type="submit" disabled={createGroupMutation.isPending || updateGroupMutation.isPending} data-testid="button-submit-group">
                {createGroupMutation.isPending || updateGroupMutation.isPending ? "Đang xử lý..." : selectedGroup ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Criteria Dialog */}
      <Dialog open={criteriaDialogOpen} onOpenChange={setCriteriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCriteria ? "Sửa tiêu chí" : "Thêm tiêu chí mới"}</DialogTitle>
            <DialogDescription>
              {selectedCriteria ? "Cập nhật thông tin tiêu chí" : "Tạo tiêu chí mới"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCriteria} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="criteria-name">Tên tiêu chí *</Label>
              <Input
                id="criteria-name"
                value={criteriaFormData.name}
                onChange={(e) => setCriteriaFormData({ ...criteriaFormData, name: e.target.value })}
                required
                data-testid="input-criteria-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria-group">Nhóm tiêu chí *</Label>
              <Select
                value={criteriaFormData.groupId}
                onValueChange={(value) => setCriteriaFormData({ ...criteriaFormData, groupId: value })}
              >
                <SelectTrigger data-testid="select-criteria-group">
                  <SelectValue placeholder="Chọn nhóm tiêu chí..." />
                </SelectTrigger>
                <SelectContent>
                  {criteriaGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria-maxscore">Điểm tối đa *</Label>
              <Input
                id="criteria-maxscore"
                type="number"
                step="0.1"
                min="0"
                value={criteriaFormData.maxScore}
                onChange={(e) => setCriteriaFormData({ ...criteriaFormData, maxScore: e.target.value })}
                required
                data-testid="input-criteria-maxscore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria-order">Thứ tự hiển thị *</Label>
              <Input
                id="criteria-order"
                type="number"
                min="1"
                value={criteriaFormData.displayOrder}
                onChange={(e) => setCriteriaFormData({ ...criteriaFormData, displayOrder: parseInt(e.target.value) })}
                required
                data-testid="input-criteria-order"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCriteriaDialogOpen(false)} data-testid="button-cancel-criteria">
                Hủy
              </Button>
              <Button type="submit" disabled={createCriteriaMutation.isPending || updateCriteriaMutation.isPending} data-testid="button-submit-criteria">
                {createCriteriaMutation.isPending || updateCriteriaMutation.isPending ? "Đang xử lý..." : selectedCriteria ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhóm tiêu chí</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nhóm tiêu chí <strong>{itemToDelete?.name}</strong>? 
              Tất cả tiêu chí trong nhóm này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-group">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteGroupMutation.mutate(itemToDelete.id)}
              disabled={deleteGroupMutation.isPending}
              data-testid="button-confirm-delete-group"
            >
              {deleteGroupMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Criteria Confirmation */}
      <AlertDialog open={deleteCriteriaDialogOpen} onOpenChange={setDeleteCriteriaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tiêu chí</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tiêu chí <strong>{itemToDelete?.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-criteria">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteCriteriaMutation.mutate(itemToDelete.id)}
              disabled={deleteCriteriaMutation.isPending}
              data-testid="button-confirm-delete-criteria"
            >
              {deleteCriteriaMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
