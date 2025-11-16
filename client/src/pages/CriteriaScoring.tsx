import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CriteriaTreeView, CriteriaScoreSummary } from "@/components/CriteriaTreeView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { CriteriaWithChildren, CriteriaResult } from "@shared/schema";

export default function CriteriaScoringPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  
  const [year, setYear] = useState(currentYear);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [scoringCriteria, setScoringCriteria] = useState<CriteriaWithChildren | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state for scoring
  const [scoringData, setScoringData] = useState({
    actualValue: "",
    selfScore: "",
    bonusCount: 0,
    penaltyCount: 0,
    note: ""
  });
  
  // Fetch user's unit
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });
  
  // Set default unit from user
  useEffect(() => {
    if (user?.unitId && !selectedUnit) {
      setSelectedUnit(user.unitId);
    }
  }, [user, selectedUnit]);
  
  // Fetch criteria tree
  const { data: tree = [], isLoading: treeLoading } = useQuery<CriteriaWithChildren[]>({
    queryKey: ["/api/criteria/tree", { year }],
    enabled: !!selectedUnit
  });
  
  // Fetch results
  const { data: results = [], isLoading: resultsLoading } = useQuery<CriteriaResult[]>({
    queryKey: ["/api/criteria-results", { unitId: selectedUnit, year }],
    enabled: !!selectedUnit
  });
  
  // Fetch summary
  const { data: summary } = useQuery<{
    total: number;
    byType: { [key: number]: number };
    details: Array<{ criteriaId: string; criteriaName: string; score: number }>;
  }>({
    queryKey: ["/api/criteria-results/summary", { unitId: selectedUnit, year }],
    enabled: !!selectedUnit
  });
  
  // Input result mutation
  const inputMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/criteria-results/input", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-results/summary"] });
      toast({ title: "Thành công", description: "Đã lưu kết quả" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể lưu kết quả",
        variant: "destructive" 
      });
    },
  });
  
  // Calculate mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: { criteriaId: string; unitId: string; year: number }) => {
      return await apiRequest("POST", "/api/criteria-results/calc", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/criteria-results/summary"] });
      toast({ title: "Thành công", description: "Đã tính điểm tự động" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể tính điểm",
        variant: "destructive" 
      });
    },
  });
  
  const openScoringDialog = (criteria: CriteriaWithChildren) => {
    // Check if it's a leaf node (no children)
    if (criteria.children && criteria.children.length > 0) {
      toast({
        title: "Lưu ý",
        description: "Chỉ có thể chấm điểm cho tiêu chí lá (không có tiêu chí con)",
        variant: "destructive"
      });
      return;
    }
    
    setScoringCriteria(criteria);
    
    // Load existing result if any
    const existingResult = results.find(r => r.criteriaId === criteria.id);
    if (existingResult) {
      setScoringData({
        actualValue: existingResult.actualValue?.toString() || "",
        selfScore: existingResult.selfScore?.toString() || "",
        bonusCount: existingResult.bonusCount || 0,
        penaltyCount: existingResult.penaltyCount || 0,
        note: existingResult.note || ""
      });
    } else {
      setScoringData({
        actualValue: "",
        selfScore: "",
        bonusCount: 0,
        penaltyCount: 0,
        note: ""
      });
    }
    
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setScoringCriteria(null);
  };
  
  const handleSubmit = () => {
    if (!scoringCriteria) return;
    
    const data: any = {
      criteriaId: scoringCriteria.id,
      unitId: selectedUnit,
      year: year,
      status: "draft",
      note: scoringData.note
    };
    
    // Add data based on criteria type
    if (scoringCriteria.criteriaType === 1) {
      // Định lượng - nhập giá trị thực tế
      data.actualValue = scoringData.actualValue;
    } else if (scoringCriteria.criteriaType === 2) {
      // Định tính - checkbox đạt/không đạt
      data.selfScore = scoringData.selfScore;
    } else if (scoringCriteria.criteriaType === 3) {
      // Chấm thẳng - nhập số lần
      data.actualValue = scoringData.actualValue;
    } else if (scoringCriteria.criteriaType === 4) {
      // Cộng/Trừ - nhập số lần cộng/trừ
      data.bonusCount = scoringData.bonusCount;
      data.penaltyCount = scoringData.penaltyCount;
    }
    
    inputMutation.mutate(data);
  };
  
  const handleCalculate = () => {
    if (!scoringCriteria) return;
    
    calculateMutation.mutate({
      criteriaId: scoringCriteria.id,
      unitId: selectedUnit,
      year: year
    });
  };
  
  // Build scores map for display
  const scoresMap: { [criteriaId: string]: number } = {};
  results.forEach(r => {
    scoresMap[r.criteriaId] = Number(r.finalScore || r.calculatedScore || 0);
  });
  
  if (!selectedUnit) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              Vui lòng đăng nhập với tài khoản đơn vị
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chấm điểm tiêu chí thi đua</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          {summary && (
            <div className="mb-6">
              <CriteriaScoreSummary tree={tree} scores={scoresMap} />
            </div>
          )}
          
          {/* Tree with scoring */}
          {treeLoading || resultsLoading ? (
            <div className="text-center py-12">Đang tải...</div>
          ) : (
            <div className="space-y-4">
              <CriteriaTreeView
                tree={tree}
                onScore={openScoringDialog}
                isEditable={false}
                scores={scoresMap}
                emptyMessage="Chưa có tiêu chí nào cho năm này"
              />
              
              {/* Clickable scoring */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Hướng dẫn:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Click vào tiêu chí để nhập kết quả chấm điểm</li>
                  <li>• Chỉ có thể chấm điểm cho tiêu chí lá (không có tiêu chí con)</li>
                  <li>• Nhập dữ liệu và click "Tính điểm tự động" để hệ thống tính toán</li>
                  <li>• Tổng điểm = tổng điểm của các tiêu chí lá</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Scoring Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Chấm điểm: {scoringCriteria?.name}
            </DialogTitle>
            <DialogDescription>
              {scoringCriteria?.description}
            </DialogDescription>
          </DialogHeader>
          
          {scoringCriteria && (
            <div className="space-y-4">
              {/* Điểm tối đa */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Điểm tối đa:</span>
                <span className="ml-2 text-lg font-bold text-blue-600">
                  {Number(scoringCriteria.maxScore).toFixed(2)} điểm
                </span>
              </div>
              
              {/* Type 1: Định lượng */}
              {scoringCriteria.criteriaType === 1 && (
                <div>
                  <Label htmlFor="actualValue">Giá trị thực tế đạt được *</Label>
                  <Input
                    id="actualValue"
                    type="number"
                    step="0.01"
                    value={scoringData.actualValue}
                    onChange={(e) => setScoringData({ ...scoringData, actualValue: e.target.value })}
                    placeholder="Nhập giá trị thực tế"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hệ thống sẽ tự động tính điểm dựa trên chỉ tiêu đã giao
                  </p>
                </div>
              )}
              
              {/* Type 2: Định tính */}
              {scoringCriteria.criteriaType === 2 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="achieved"
                    checked={scoringData.selfScore === scoringCriteria.maxScore?.toString()}
                    onCheckedChange={(checked) => {
                      setScoringData({
                        ...scoringData,
                        selfScore: checked ? scoringCriteria.maxScore?.toString() || "0" : "0"
                      });
                    }}
                  />
                  <Label htmlFor="achieved" className="font-normal cursor-pointer">
                    Đạt tiêu chí này (điểm = {Number(scoringCriteria.maxScore).toFixed(2)})
                  </Label>
                </div>
              )}
              
              {/* Type 3: Chấm thẳng */}
              {scoringCriteria.criteriaType === 3 && (
                <div>
                  <Label htmlFor="actualValue">Số lần/Số lượng *</Label>
                  <Input
                    id="actualValue"
                    type="number"
                    value={scoringData.actualValue}
                    onChange={(e) => setScoringData({ ...scoringData, actualValue: e.target.value })}
                    placeholder="Nhập số lần"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Điểm = Số lần × Điểm/lần
                  </p>
                </div>
              )}
              
              {/* Type 4: Cộng/Trừ */}
              {scoringCriteria.criteriaType === 4 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bonusCount">Số lần cộng điểm</Label>
                    <Input
                      id="bonusCount"
                      type="number"
                      value={scoringData.bonusCount}
                      onChange={(e) => setScoringData({ ...scoringData, bonusCount: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="penaltyCount">Số lần trừ điểm</Label>
                    <Input
                      id="penaltyCount"
                      type="number"
                      value={scoringData.penaltyCount}
                      onChange={(e) => setScoringData({ ...scoringData, penaltyCount: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}
              
              {/* Note */}
              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Input
                  id="note"
                  value={scoringData.note}
                  onChange={(e) => setScoringData({ ...scoringData, note: e.target.value })}
                  placeholder="Ghi chú thêm (không bắt buộc)"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button variant="secondary" onClick={handleCalculate}>
              <Calculator className="w-4 h-4 mr-2" />
              Tính điểm tự động
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              Lưu kết quả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
