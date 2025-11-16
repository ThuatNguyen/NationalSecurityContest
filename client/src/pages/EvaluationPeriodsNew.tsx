import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScoringModal from "@/components/ScoringModal";
import ReviewModal from "@/components/ReviewModal";
import { useToast } from "@/hooks/use-toast";

interface Criteria {
  id: string;
  name: string;
  code?: string;
  level?: number;
  criteriaType?: number; // 0=cha, 1=định lượng, 2=định tính, 3=chấm thẳng, 4=cộng/trừ
  maxScore: number;
  displayOrder: number;
  selfScore?: number;
  selfScoreFile?: string;
  review1Score?: number;
  review1Comment?: string;
  review1File?: string;
  review2Score?: number;
  review2Comment?: string;
  review2File?: string;
  finalScore?: number;
}

interface CriteriaGroup {
  id: string;
  name: string;
  displayOrder: number;
  criteria: Criteria[];
}

interface EvaluationSummary {
  period: {
    id: string;
    name: string;
    year: number;
    startDate: string;
    endDate: string;
    status: string;
  };
  evaluation: {
    id: string;
    periodId: string;
    unitId: string;
    clusterId: string;
    status: string;
  } | null;
  criteriaGroups: CriteriaGroup[];
}

export default function EvaluationPeriodsNew() {
  const { user } = useSession();
  const { toast } = useToast();
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria | null>(null);
  const [reviewType, setReviewType] = useState<"review1" | "review2">("review1");

  // 1. Load evaluation periods
  const { data: periods = [], isLoading: loadingPeriods } = useQuery<any[]>({
    queryKey: ['/api/evaluation-periods'],
    enabled: !!user,
  });

  // 2. Load clusters for selected period
  const { data: periodClusters = [], isLoading: loadingClusters } = useQuery<any[]>({
    queryKey: [`/api/evaluation-periods/${selectedPeriodId}/clusters`],
    enabled: !!selectedPeriodId,
  });

  // 3. Load units for selected cluster
  const { data: units = [], isLoading: loadingUnits } = useQuery<any[]>({
    queryKey: ['/api/units', selectedClusterId],
    queryFn: async () => {
      const res = await fetch(`/api/units${selectedClusterId ? `?clusterId=${selectedClusterId}` : ''}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch units');
      return res.json();
    },
    enabled: !!selectedClusterId,
  });

  // 4. Load evaluation summary
  const { 
    data: summary, 
    isLoading: loadingSummary,
    refetch: refetchSummary 
  } = useQuery<EvaluationSummary>({
    queryKey: [`/api/evaluation-periods/${selectedPeriodId}/units/${selectedUnitId}/summary`],
    enabled: !!selectedPeriodId && !!selectedUnitId,
  });

  // Auto-select for user role - Get unit and cluster info
  useEffect(() => {
    if (!user) return;

    const autoSelectUserInfo = async () => {
      if (user.role === 'user' && user.unitId) {
        try {
          const res = await fetch(`/api/units/${user.unitId}`, { credentials: 'include' });
          const unit = await res.json();
          setSelectedClusterId(unit.clusterId);
          setSelectedUnitId(user.unitId);
        } catch (error) {
          console.error('Failed to fetch unit:', error);
        }
      } else if (user.role === 'cluster_leader' && user.clusterId) {
        setSelectedClusterId(user.clusterId);
      }
    };

    autoSelectUserInfo();
  }, [user]);

  // Auto-select first period if only one available
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      // Find active period or use first
      const activePeriod = periods.find(p => p.status === 'active') || periods[0];
      setSelectedPeriodId(activePeriod.id);
    }
  }, [periods, selectedPeriodId]);

  // Auto-select cluster in periodClusters after loading
  useEffect(() => {
    if (selectedClusterId && periodClusters.length > 0) {
      // Check if selected cluster exists in period's clusters
      const clusterExists = periodClusters.some((c: any) => c.id === selectedClusterId);
      if (clusterExists) {
        // Keep current selection
        return;
      } else if (user?.role === 'admin' || user?.role === 'cluster_leader') {
        // Auto-select first cluster for admin/cluster_leader
        setSelectedClusterId(periodClusters[0].id);
      }
    } else if (periodClusters.length === 1 && !selectedClusterId) {
      // Auto-select if only one cluster
      setSelectedClusterId(periodClusters[0].id);
    }
  }, [periodClusters, selectedClusterId, user?.role]);

  const handleScoringSubmit = async () => {
    await refetchSummary();
    toast({ title: "Đã lưu điểm thành công" });
  };

  const handleReviewSubmit = async () => {
    await refetchSummary();
    toast({ title: "Đã lưu đánh giá thành công" });
  };

  const canEdit = () => {
    if (!summary?.period || !summary?.evaluation) return false;
    const status = summary.period.status;
    const evalStatus = summary.evaluation.status;

    if (user?.role === 'user') {
      return status === 'active' && evalStatus === 'draft';
    }
    if (user?.role === 'cluster_leader') {
      return status === 'review1';
    }
    if (user?.role === 'admin') {
      return status === 'review2';
    }
    return false;
  };

  if (!user) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chấm điểm thi đua</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <Label>Kỳ thi đua</Label>
              <Select
                value={selectedPeriodId}
                onValueChange={setSelectedPeriodId}
                disabled={loadingPeriods}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỳ thi đua" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period: any) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({period.year})
                      <Badge className="ml-2" variant={period.status === 'active' ? 'default' : 'secondary'}>
                        {period.status}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cluster Filter */}
            <div className="space-y-2">
              <Label>Cụm thi đua</Label>
              <Select
                value={selectedClusterId}
                onValueChange={setSelectedClusterId}
                disabled={!selectedPeriodId || loadingClusters || user.role === 'user'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cụm" />
                </SelectTrigger>
                <SelectContent>
                  {periodClusters.map((cluster: any) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Filter */}
            <div className="space-y-2">
              <Label>Đơn vị</Label>
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
                disabled={!selectedClusterId || loadingUnits || user.role === 'user'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => refetchSummary()}
                disabled={!selectedPeriodId || !selectedUnitId}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Info Alert */}
          {summary && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{summary.period.name}</strong> - Năm {summary.period.year}
                    {summary.evaluation && (
                      <span className="ml-4">
                        Trạng thái: <Badge>{summary.evaluation.status}</Badge>
                      </span>
                    )}
                  </div>
                  {canEdit() && (
                    <Badge variant="default">Có thể chỉnh sửa</Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Criteria Table */}
      {loadingSummary ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">Đang tải dữ liệu...</div>
          </CardContent>
        </Card>
      ) : !summary ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Vui lòng chọn kỳ thi đua, cụm và đơn vị
            </div>
          </CardContent>
        </Card>
      ) : summary.criteriaGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <Alert>
              <AlertDescription>
                Chưa có tiêu chí thi đua cho cụm này
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium w-12">Mã</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tiêu chí</th>
                    <th className="px-4 py-3 text-center text-sm font-medium w-24">Điểm tối đa</th>
                    <th className="px-4 py-3 text-center text-sm font-medium w-24">Tự chấm</th>
                    <th className="px-4 py-3 text-center text-sm font-medium w-24">Phúc tra 1</th>
                    <th className="px-4 py-3 text-center text-sm font-medium w-24">Phúc tra 2</th>
                    <th className="px-4 py-3 text-center text-sm font-medium w-24">Điểm cuối</th>
                    <th className="px-4 py-3 text-center text-sm font-medium w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.criteriaGroups.map((group, groupIndex) => (
                    <Fragment key={group.id}>
                      {group.criteria.map((item, itemIndex) => {
                        const indentLevel = (item.level || 1) - 1;
                        const indentClass = indentLevel > 0 ? `pl-${Math.min(indentLevel * 8, 32)}` : '';
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm text-center">
                              {item.code || `${groupIndex + 1}.${itemIndex + 1}`}
                            </td>
                            <td className={`px-4 py-3 text-sm ${indentClass}`}>
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-medium">
                              {item.maxScore}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {item.selfScore !== undefined ? item.selfScore : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {item.review1Score !== undefined ? item.review1Score : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {item.review2Score !== undefined ? item.review2Score : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              {item.finalScore !== undefined ? item.finalScore : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {canEdit() && item.criteriaType && item.criteriaType > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCriteria(item);
                                    if (user?.role === 'user') {
                                      setScoringModalOpen(true);
                                    } else {
                                      setReviewType(user?.role === 'cluster_leader' ? 'review1' : 'review2');
                                      setReviewModalOpen(true);
                                    }
                                  }}
                                >
                                  {user?.role === 'user' ? 'Chấm điểm' : 'Đánh giá'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedCriteria && summary?.evaluation && (
        <>
          <ScoringModal
            open={scoringModalOpen}
            onClose={() => setScoringModalOpen(false)}
            criteriaName={selectedCriteria.name}
            maxScore={selectedCriteria.maxScore}
            currentScore={selectedCriteria.selfScore}
            currentFile={selectedCriteria.selfScoreFile}
            onSave={async (score: number, file: File | null) => {
              if (!summary?.evaluation) return;
              
              const formData = new FormData();
              formData.append('score', score.toString());
              if (file) {
                formData.append('file', file);
              }

              const res = await fetch(`/api/evaluations/${summary.evaluation.id}/scores/${selectedCriteria.id}`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
              });

              if (!res.ok) throw new Error('Failed to save score');
              
              await handleScoringSubmit();
              setScoringModalOpen(false);
            }}
          />
          <ReviewModal
            open={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            criteriaName={selectedCriteria.name}
            maxScore={selectedCriteria.maxScore}
            selfScore={selectedCriteria.selfScore}
            currentReviewScore={reviewType === 'review1' ? selectedCriteria.review1Score : selectedCriteria.review2Score}
            currentComment={reviewType === 'review1' ? selectedCriteria.review1Comment : selectedCriteria.review2Comment}
            currentFile={reviewType === 'review1' ? selectedCriteria.review1File : selectedCriteria.review2File}
            reviewType={reviewType}
            onSave={async (score: number, comment: string, file: File | null) => {
              if (!summary?.evaluation) return;
              
              const formData = new FormData();
              formData.append('score', score.toString());
              formData.append('comment', comment);
              if (file) {
                formData.append('file', file);
              }

              const res = await fetch(
                `/api/evaluations/${summary.evaluation.id}/reviews/${selectedCriteria.id}?type=${reviewType}`,
                {
                  method: 'POST',
                  body: formData,
                  credentials: 'include',
                }
              );

              if (!res.ok) throw new Error('Failed to save review');
              
              await handleReviewSubmit();
              setReviewModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
