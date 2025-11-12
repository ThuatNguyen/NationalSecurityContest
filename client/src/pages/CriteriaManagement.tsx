import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Cluster, CriteriaGroup, Criteria } from "@shared/schema";

export default function CriteriaManagement() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedClusterId, setSelectedClusterId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: clusters, isLoading: clustersLoading } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  const { data: criteriaGroups, isLoading: groupsLoading } = useQuery<CriteriaGroup[]>({
    queryKey: ["/api/criteria-groups", selectedClusterId, selectedYear],
    enabled: !!selectedClusterId && !!selectedYear,
  });

  const { data: allCriteria, isLoading: criteriaLoading } = useQuery<Criteria[]>({
    queryKey: ["/api/criteria/all", criteriaGroups?.map(g => g.id)],
    enabled: !!criteriaGroups && criteriaGroups.length > 0,
    queryFn: async () => {
      if (!criteriaGroups || criteriaGroups.length === 0) return [];
      const results = await Promise.all(
        criteriaGroups.map(group => 
          fetch(`/api/criteria?groupId=${group.id}`).then(res => res.json())
        )
      );
      return results.flat();
    },
  });

  const groupedCriteria = (allCriteria || []).reduce((acc, criteria) => {
    const group = criteriaGroups?.find(g => g.id === criteria.groupId);
    if (group) {
      const groupName = group.name;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(criteria);
    }
    return acc;
  }, {} as Record<string, Criteria[]>);

  const filteredGroupedCriteria = Object.entries(groupedCriteria).reduce((acc, [groupName, items]) => {
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[groupName] = filteredItems;
    }
    return acc;
  }, {} as Record<string, Criteria[]>);

  const calculateGroupTotal = (items: Criteria[]) => {
    return items.reduce((sum, item) => sum + parseFloat(item.maxScore), 0);
  };

  const isLoading = clustersLoading || groupsLoading || criteriaLoading;
  const totalCriteria = allCriteria?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tiêu chí thi đua</h1>
        <p className="text-muted-foreground mt-1">Cấu hình tiêu chí cho từng cụm thi đua</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-year-criteria" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              Năm áp dụng
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="filter-year-criteria" data-testid="select-year-criteria">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-cluster-criteria" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              Cụm thi đua
            </Label>
            <Select 
              value={selectedClusterId} 
              onValueChange={setSelectedClusterId}
              disabled={clustersLoading}
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
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Danh sách tiêu chí</h2>
          <div className="flex gap-3 flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Tìm kiếm tiêu chí..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
            <Button data-testid="button-add" disabled={!selectedClusterId}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm tiêu chí
            </Button>
          </div>
        </div>

        {!selectedClusterId ? (
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
                    {Object.entries(filteredGroupedCriteria).map(([groupName, items], groupIndex) => {
                      const groupTotal = calculateGroupTotal(items);
                      let itemCounter = 0;

                      return (
                        <>
                          <tr key={`group-${groupIndex}`} className="bg-accent/50">
                            <td colSpan={2} className="px-4 py-2 font-semibold text-sm">
                              {groupName}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-sm">
                              {groupTotal.toFixed(1)}
                            </td>
                            <td className="px-4 py-2"></td>
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
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => console.log("Edit criteria:", item)}
                                      data-testid={`button-edit-${item.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => console.log("Delete criteria:", item)}
                                      data-testid={`button-delete-${item.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </>
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
    </div>
  );
}
