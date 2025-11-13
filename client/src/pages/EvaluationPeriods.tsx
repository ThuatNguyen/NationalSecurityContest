import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Send } from "lucide-react";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import ScoringModal from "@/components/ScoringModal";
import ReviewModal from "@/components/ReviewModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Criteria {
  id: string;
  name: string;
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
    clusterId: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  evaluation: {
    id: string;
    periodId: string;
    unitId: string;
    status: string;
    submittedAt?: string;
  } | null;
  criteriaGroups: CriteriaGroup[];
}

export default function EvaluationPeriods() {
  const { user } = useSession();
  const { toast } = useToast();
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria | null>(null);
  const [reviewType, setReviewType] = useState<"review1" | "review2">("review1");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Query clusters
  const { 
    data: clusters, 
    isLoading: loadingClusters 
  } = useQuery<any[]>({
    queryKey: ['/api/clusters'],
    enabled: !!user,
  });

  // Query units (filtered by cluster if selected)
  const { 
    data: units, 
    isLoading: loadingUnits 
  } = useQuery<any[]>({
    queryKey: ['/api/units'],
    enabled: !!user,
  });

  // Query evaluation periods
  const { 
    data: periods, 
    isLoading: loadingPeriods, 
    error: periodsError,
    refetch: refetchPeriods 
  } = useQuery<any[]>({
    queryKey: ['/api/evaluation-periods'],
    enabled: !!user,
  });

  // Memoize filtered units by selected cluster
  const filteredUnits = useMemo(() => {
    if (!units || !selectedClusterId) return [];
    return units.filter(u => u.clusterId === selectedClusterId);
  }, [units, selectedClusterId]);

  // Set default cluster and unit based on role
  useEffect(() => {
    if (!user || !clusters || !units) return;

    // Skip if already set
    if (selectedClusterId && selectedUnitId) return;

    if (user.role === 'admin') {
      // Admin: default to first cluster
      if (!selectedClusterId && clusters.length > 0) {
        const firstCluster = clusters[0];
        setSelectedClusterId(firstCluster.id);
        
        // Then default to first unit in that cluster
        const unitsInCluster = units.filter(u => u.clusterId === firstCluster.id);
        if (unitsInCluster.length > 0) {
          setSelectedUnitId(unitsInCluster[0].id);
        }
      }
    } else if (user.role === 'cluster_leader') {
      // Cluster leader: lock to their cluster
      if (!selectedClusterId && user.clusterId) {
        setSelectedClusterId(user.clusterId);
        
        // Default to first unit in their cluster
        const unitsInCluster = units.filter(u => u.clusterId === user.clusterId);
        if (unitsInCluster.length > 0) {
          setSelectedUnitId(unitsInCluster[0].id);
        }
      }
    } else {
      // User: lock to their unit's cluster and their unit
      if (!selectedClusterId && !selectedUnitId && user.unitId) {
        const userUnit = units.find(u => u.id === user.unitId);
        if (userUnit) {
          setSelectedClusterId(userUnit.clusterId);
          setSelectedUnitId(user.unitId);
        }
      }
    }
  }, [user, clusters, units, selectedClusterId, selectedUnitId]);

  // Handle cluster change (only for admin)
  const handleClusterChange = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    // Reset unit when cluster changes
    setSelectedUnitId('');
    
    // Auto-select first unit in new cluster
    const unitsInCluster = units?.filter(u => u.clusterId === clusterId) || [];
    if (unitsInCluster.length > 0) {
      setSelectedUnitId(unitsInCluster[0].id);
    }
  };

  // Memoize available years from periods
  const availableYears = useMemo(() => {
    if (!periods) return [];
    const years = Array.from(new Set(periods.map(p => p.year))).sort((a, b) => b - a);
    return years;
  }, [periods]);

  // Memoize filtered periods
  const filteredPeriods = useMemo(() => {
    if (!periods) return [];
    return periods.filter(p => {
      if (p.year !== selectedYear) return false;
      if (user?.role === 'cluster_leader' && p.clusterId !== user.clusterId) return false;
      return true;
    });
  }, [periods, selectedYear, user]);

  const selectedPeriod = filteredPeriods[0]; // Auto-select first period

  // Query evaluation summary (only when period and unit are available)
  const { 
    data: summary, 
    isLoading: loadingSummary, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery<EvaluationSummary>({
    queryKey: ['/api/evaluation-periods', selectedPeriod?.id, 'units', selectedUnitId, 'summary'],
    enabled: !!selectedPeriod?.id && !!selectedUnitId,
  });

  const handleOpenScoringModal = (criteria: Criteria) => {
    setSelectedCriteria(criteria);
    setScoringModalOpen(true);
  };

  const handleOpenReviewModal = (criteria: Criteria, type: "review1" | "review2") => {
    setSelectedCriteria(criteria);
    setReviewType(type);
    setReviewModalOpen(true);
  };

  // Mutation for saving scores
  const saveScoreMutation = useMutation({
    mutationFn: async ({ score, file, criteriaId, existingFileUrl }: { score: number; file: File | null; criteriaId: string; existingFileUrl?: string | null }) => {
      let fileUrl: string | undefined = existingFileUrl || undefined; // Preserve existing file

      // Upload file if provided (overwrites existing)
      if (file) {
        console.log('[SCORE SAVE] Uploading file:', file.name, 'size:', file.size);
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadRes.ok) {
          console.error('[SCORE SAVE] Upload failed:', uploadRes.status, uploadRes.statusText);
          throw new Error('Upload file thất bại');
        }

        const uploadData = await uploadRes.json();
        fileUrl = uploadData.fileUrl;
        console.log('[SCORE SAVE] Upload successful, fileUrl:', fileUrl);
      } else {
        console.log('[SCORE SAVE] No new file, preserving existing:', fileUrl);
      }

      // Capture current periodId and unitId for invalidation
      const currentPeriodId = selectedPeriod?.id;
      const currentUnitId = selectedUnitId;

      // Ensure evaluation exists (create if needed)
      let evaluationId = summary?.evaluation?.id;
      if (!evaluationId) {
        console.log('[SCORE SAVE] No evaluation found, creating one via ensure endpoint');
        const ensureRes = await apiRequest('POST', '/api/evaluations/ensure', {
          periodId: currentPeriodId,
          unitId: currentUnitId,
        });
        const ensureData = await ensureRes.json();
        evaluationId = ensureData.id;
        console.log('[SCORE SAVE] Evaluation ensured, id:', evaluationId);
      }

      // Build score data, omitting undefined file URLs (don't overwrite with null)
      const scoreData: any = {
        criteriaId,
        selfScore: score,
      };
      
      // Only include selfScoreFile if we have a valid URL
      if (fileUrl) {
        scoreData.selfScoreFile = fileUrl;
      }

      console.log('[SCORE SAVE] Sending scores update:', [scoreData]);
      const res = await apiRequest('PUT', `/api/evaluations/${evaluationId}/scores`, { scores: [scoreData] });
      const result = await res.json();
      console.log('[SCORE SAVE] Update successful, result:', result);
      
      // Return captured IDs for invalidation
      return { result, periodId: currentPeriodId, unitId: currentUnitId };
    },
    onSuccess: (data) => {
      console.log('[SCORE SAVE] onSuccess called, invalidating cache for:', data.periodId, data.unitId);
      // Invalidate using captured IDs to ensure correct query is invalidated
      queryClient.invalidateQueries({ 
        queryKey: ['/api/evaluation-periods', data.periodId, 'units', data.unitId, 'summary'] 
      });
      toast({
        title: "Thành công",
        description: "Đã lưu điểm thành công",
      });
      setScoringModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu điểm",
        variant: "destructive",
      });
    },
  });

  const handleSaveScore = (score: number, file: File | null) => {
    if (!selectedCriteria) return;
    saveScoreMutation.mutate({
      score,
      file,
      criteriaId: selectedCriteria.id,
      existingFileUrl: selectedCriteria.selfScoreFile, // Preserve existing file when no new upload
    });
  };

  // Mutation for saving review scores
  const saveReviewMutation = useMutation({
    mutationFn: async ({ score, comment, file, criteriaId, reviewType, existingFileUrl }: { 
      score: number; 
      comment: string; 
      file: File | null; 
      criteriaId: string; 
      reviewType: "review1" | "review2";
      existingFileUrl?: string | null;
    }) => {
      let fileUrl: string | undefined = existingFileUrl || undefined; // Preserve existing file

      // Upload file if provided (overwrites existing)
      if (file) {
        console.log('[REVIEW SAVE] Uploading file:', file.name, 'size:', file.size);
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadRes.ok) {
          console.error('[REVIEW SAVE] Upload failed:', uploadRes.status, uploadRes.statusText);
          throw new Error('Upload file thất bại');
        }

        const uploadData = await uploadRes.json();
        fileUrl = uploadData.fileUrl;
        console.log('[REVIEW SAVE] Upload successful, fileUrl:', fileUrl);
      } else {
        console.log('[REVIEW SAVE] No new file, preserving existing:', fileUrl);
      }

      // Capture current periodId and unitId for invalidation
      const currentPeriodId = selectedPeriod?.id;
      const currentUnitId = selectedUnitId;

      // Ensure evaluation exists (create if needed)
      let evaluationId = summary?.evaluation?.id;
      if (!evaluationId) {
        console.log('[REVIEW SAVE] No evaluation found, creating one via ensure endpoint');
        const ensureRes = await apiRequest('POST', '/api/evaluations/ensure', {
          periodId: currentPeriodId,
          unitId: currentUnitId,
        });
        const ensureData = await ensureRes.json();
        evaluationId = ensureData.id;
        console.log('[REVIEW SAVE] Evaluation ensured, id:', evaluationId);
      }

      // Build score data based on review type
      const scoreData: any = {
        criteriaId,
      };
      
      if (reviewType === "review1") {
        scoreData.review1Score = score;
        scoreData.review1Comment = comment;
        if (fileUrl) {
          scoreData.review1File = fileUrl;
        }
      } else {
        scoreData.review2Score = score;
        scoreData.review2Comment = comment;
        if (fileUrl) {
          scoreData.review2File = fileUrl;
        }
      }

      console.log('[REVIEW SAVE] Sending scores update:', [scoreData]);
      const res = await apiRequest('PUT', `/api/evaluations/${evaluationId}/scores`, { scores: [scoreData] });
      const result = await res.json();
      console.log('[REVIEW SAVE] Update successful, result:', result);
      
      // Return captured IDs for invalidation
      return { result, periodId: currentPeriodId, unitId: currentUnitId };
    },
    onSuccess: (data) => {
      console.log('[REVIEW SAVE] onSuccess called, invalidating cache for:', data.periodId, data.unitId);
      // Invalidate using captured IDs to ensure correct query is invalidated
      queryClient.invalidateQueries({ 
        queryKey: ['/api/evaluation-periods', data.periodId, 'units', data.unitId, 'summary'] 
      });
      toast({
        title: "Thành công",
        description: "Đã lưu điểm thẩm định thành công",
      });
      setReviewModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu điểm thẩm định",
        variant: "destructive",
      });
    },
  });

  const handleSaveReview = (score: number, comment: string, file: File | null) => {
    if (!selectedCriteria) return;
    
    // Determine existing file URL based on review type
    const existingFileUrl = reviewType === "review1" 
      ? selectedCriteria.review1File 
      : selectedCriteria.review2File;
    
    saveReviewMutation.mutate({
      score,
      comment,
      file,
      criteriaId: selectedCriteria.id,
      reviewType,
      existingFileUrl,
    });
  };

  // Mutation for submitting evaluation
  const submitEvaluationMutation = useMutation({
    mutationFn: async () => {
      // Validate context
      const currentPeriodId = selectedPeriod?.id;
      const currentUnitId = selectedUnitId;
      
      if (!currentPeriodId || !currentUnitId) {
        throw new Error('Thiếu thông tin kỳ thi đua hoặc đơn vị.');
      }

      // Ensure evaluation exists (create if needed)
      let evaluationId = summary?.evaluation?.id;
      if (!evaluationId) {
        console.log('[SUBMIT] No evaluation found, creating one via ensure endpoint');
        const ensureRes = await apiRequest('POST', '/api/evaluations/ensure', {
          periodId: currentPeriodId,
          unitId: currentUnitId,
        });
        const ensureData = await ensureRes.json();
        evaluationId = ensureData.id;
        console.log('[SUBMIT] Evaluation ensured, id:', evaluationId);
      }

      // apiRequest will throw on non-2xx, so we can safely await the response
      const res = await apiRequest('POST', `/api/evaluations/${evaluationId}/submit`, {});
      
      // If we get here, response is 2xx, safe to parse
      if (!res.ok) {
        throw new Error('Không thể nộp bài. Vui lòng thử lại.');
      }
      
      const result = await res.json();
      
      return { result, periodId: currentPeriodId, unitId: currentUnitId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/evaluation-periods', data.periodId, 'units', data.unitId, 'summary'] 
      });
      toast({
        title: "Thành công",
        description: "Đã nộp bài thành công. Đánh giá đang chờ thẩm định.",
      });
      setSubmitDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nộp bài",
        variant: "destructive",
      });
      setSubmitDialogOpen(false);
    },
  });

  const handleSubmitEvaluation = () => {
    submitEvaluationMutation.mutate();
  };

  // Calculate group totals
  const calculateGroupTotal = (items: Criteria[], field: keyof Criteria) => {
    return items.reduce((sum, item) => {
      const value = item[field];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  // Calculate overall totals
  const calculateOverallTotal = (field: keyof Criteria) => {
    return summary?.criteriaGroups.reduce((sum, group) => {
      return sum + calculateGroupTotal(group.criteria, field);
    }, 0) || 0;
  };

  // Render permission check
  const canReview1 = user?.role === 'admin' || user?.role === 'cluster_leader';
  const canReview2 = user?.role === 'admin';

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Kỳ thi đua</h1>
          <p className="text-muted-foreground mt-1">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kỳ thi đua</h1>
        <p className="text-muted-foreground mt-1">Xem và quản lý điểm thi đua theo kỳ</p>
      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-md">
        {/* Năm thi đua */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-year" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Năm thi đua
          </Label>
          {loadingPeriods ? (
            <Skeleton className="h-10 w-full" />
          ) : availableYears.length > 0 ? (
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger id="filter-year" data-testid="select-year">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm text-muted-foreground">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Cụm thi đua */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-cluster" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Cụm thi đua
          </Label>
          {loadingClusters ? (
            <Skeleton className="h-10 w-full" />
          ) : user.role === 'admin' ? (
            <Select 
              value={selectedClusterId} 
              onValueChange={handleClusterChange}
            >
              <SelectTrigger id="filter-cluster" data-testid="select-cluster">
                <SelectValue placeholder="Chọn cụm" />
              </SelectTrigger>
              <SelectContent>
                {clusters?.map(cluster => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm" data-testid="text-cluster">
              {clusters?.find(c => c.id === selectedClusterId)?.name || 'Chưa có cụm'}
            </div>
          )}
        </div>

        {/* Đơn vị */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-unit" className="text-xs font-semibold uppercase tracking-wide mb-2 block">
            Đơn vị
          </Label>
          {loadingUnits ? (
            <Skeleton className="h-10 w-full" />
          ) : user.role === 'user' ? (
            <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm" data-testid="text-unit">
              {units?.find(u => u.id === selectedUnitId)?.name || 'Chưa có đơn vị'}
            </div>
          ) : (
            <Select 
              value={selectedUnitId} 
              onValueChange={setSelectedUnitId}
            >
              <SelectTrigger id="filter-unit" data-testid="select-unit">
                <SelectValue placeholder="Chọn đơn vị" />
              </SelectTrigger>
              <SelectContent>
                {filteredUnits.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {periodsError && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Không thể tải danh sách kỳ thi đua. Vui lòng thử lại.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchPeriods()}
              data-testid="button-retry-periods"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {summaryError && selectedPeriod && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Không thể tải dữ liệu thi đua. Vui lòng thử lại.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchSummary()}
              data-testid="button-retry-summary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loadingPeriods || loadingSummary ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : !selectedPeriod ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">Không có kỳ thi đua nào cho năm {selectedYear}</p>
        </div>
      ) : !summary ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">Không có dữ liệu thi đua cho kỳ này</p>
        </div>
      ) : (
        <>
          {/* Status and Action Strip */}
          {summary.evaluation && (
            <div className="flex items-center justify-between gap-4 p-4 bg-card border rounded-md mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
                <Badge 
                  variant={
                    summary.evaluation.status === 'draft' ? 'secondary' :
                    summary.evaluation.status === 'submitted' ? 'default' :
                    summary.evaluation.status === 'review1_completed' ? 'default' :
                    summary.evaluation.status === 'explanation_submitted' ? 'default' :
                    summary.evaluation.status === 'review2_completed' ? 'default' :
                    summary.evaluation.status === 'finalized' ? 'default' : 'secondary'
                  }
                  data-testid="badge-evaluation-status"
                >
                  {
                    summary.evaluation.status === 'draft' ? 'Nháp' :
                    summary.evaluation.status === 'submitted' ? 'Đã nộp' :
                    summary.evaluation.status === 'review1_completed' ? 'Đã thẩm định lần 1' :
                    summary.evaluation.status === 'explanation_submitted' ? 'Đã giải trình' :
                    summary.evaluation.status === 'review2_completed' ? 'Đã thẩm định lần 2' :
                    summary.evaluation.status === 'finalized' ? 'Hoàn tất' : summary.evaluation.status
                  }
                </Badge>
              </div>
              
              {user.role === 'user' && summary.evaluation.status === 'draft' && selectedPeriod && selectedUnitId && (
                <Button
                  variant="default"
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={submitEvaluationMutation.isPending}
                  data-testid="button-submit-evaluation"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitEvaluationMutation.isPending ? 'Đang nộp...' : 'Nộp bài'}
                </Button>
              )}
            </div>
          )}

          {/* Disable scoring info when not in draft */}
          {summary.evaluation && summary.evaluation.status !== 'draft' && user.role === 'user' && (
            <Alert className="mb-4">
              <AlertDescription>
                Đánh giá đã được nộp. Bạn không thể chỉnh sửa điểm tự chấm.
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-12" rowSpan={2}>STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[300px]" rowSpan={2}>Tên tiêu chí</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-24" rowSpan={2}>Điểm tối đa</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide border-l" colSpan={2}>Điểm tự chấm</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32 border-l" rowSpan={2}>Thẩm định lần 1</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-[200px]" rowSpan={2}>Giải trình</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32 border-l" rowSpan={2}>Thẩm định lần 2</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-32" rowSpan={2}>Điểm cuối cùng</th>
                </tr>
                <tr className="border-b">
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide w-24 border-l">Điểm</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide w-24">File</th>
                </tr>
              </thead>
              <tbody>
                {summary.criteriaGroups.map((group, groupIndex) => {
                  const groupTotals = {
                    maxScore: calculateGroupTotal(group.criteria, 'maxScore'),
                    selfScore: calculateGroupTotal(group.criteria, 'selfScore'),
                    review1Score: calculateGroupTotal(group.criteria, 'review1Score'),
                    review2Score: calculateGroupTotal(group.criteria, 'review2Score'),
                    finalScore: calculateGroupTotal(group.criteria, 'finalScore'),
                  };

                  return (
                    <Fragment key={group.id}>
                      <tr className="bg-accent/50">
                        <td colSpan={2} className="px-4 py-2 font-semibold text-sm">
                          {group.name}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold text-sm">
                          {groupTotals.maxScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold text-sm border-l">
                          {groupTotals.selfScore.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center"></td>
                        <td className="px-4 py-2 text-center font-semibold text-sm border-l">
                          {groupTotals.review1Score.toFixed(2)}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 text-center font-semibold text-sm border-l">
                          {groupTotals.review2Score.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold text-sm text-primary">
                          {groupTotals.finalScore.toFixed(2)}
                        </td>
                      </tr>
                      {group.criteria.map((item, itemIndex) => (
                        <tr key={item.id} className="border-b hover-elevate" data-testid={`row-criteria-${item.id}`}>
                          <td className="px-4 py-3 text-sm text-center">{groupIndex * 10 + itemIndex + 1}</td>
                          <td className="px-4 py-3 text-sm pl-8">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-center font-medium" data-testid={`text-maxscore-${item.id}`}>
                            {item.maxScore}
                          </td>
                          <td className="px-4 py-3 text-center border-l">
                            {user.role === "user" && summary.evaluation?.status === 'draft' && selectedPeriod && selectedUnitId ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenScoringModal(item)}
                                className="font-medium text-sm"
                                data-testid={`button-selfscore-${item.id}`}
                              >
                                {item.selfScore != null && !isNaN(Number(item.selfScore)) ? Number(item.selfScore).toFixed(2) : 'Chấm điểm'}
                              </Button>
                            ) : (
                              <span className="font-medium text-sm" data-testid={`text-selfscore-${item.id}`}>
                                {item.selfScore != null && !isNaN(Number(item.selfScore)) ? Number(item.selfScore).toFixed(2) : '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.selfScoreFile ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(item.selfScoreFile, '_blank')}
                                className="h-8 w-8"
                                title="Xem file minh chứng"
                                data-testid={`button-view-self-file-${item.id}`}
                              >
                                <FileText className="w-4 h-4 text-primary" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center border-l">
                            {canReview1 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReviewModal(item, "review1")}
                                className="font-medium text-sm"
                                data-testid={`button-review1-${item.id}`}
                              >
                                {item.review1Score != null && !isNaN(Number(item.review1Score)) ? Number(item.review1Score).toFixed(2) : 'Thẩm định'}
                              </Button>
                            ) : (
                              <span className="font-medium text-sm" data-testid={`text-review1-${item.id}`}>
                                {item.review1Score != null && !isNaN(Number(item.review1Score)) ? Number(item.review1Score).toFixed(2) : '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground" data-testid={`text-explanation-${item.id}`}>
                              {item.review1Comment || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center border-l">
                            {canReview2 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReviewModal(item, "review2")}
                                className="font-medium text-sm"
                                data-testid={`button-review2-${item.id}`}
                              >
                                {item.review2Score != null && !isNaN(Number(item.review2Score)) ? Number(item.review2Score).toFixed(2) : 'Thẩm định'}
                              </Button>
                            ) : (
                              <span className="font-medium text-sm" data-testid={`text-review2-${item.id}`}>
                                {item.review2Score != null && !isNaN(Number(item.review2Score)) ? Number(item.review2Score).toFixed(2) : '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-sm text-primary" data-testid={`text-finalscore-${item.id}`}>
                              {item.finalScore != null && !isNaN(Number(item.finalScore)) ? Number(item.finalScore).toFixed(2) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
                <tr className="bg-muted font-bold">
                  <td colSpan={2} className="px-4 py-3 text-sm">TỔNG CỘNG</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {calculateOverallTotal('maxScore').toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center border-l">
                    {calculateOverallTotal('selfScore').toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center"></td>
                  <td className="px-4 py-3 text-sm text-center border-l">
                    {calculateOverallTotal('review1Score').toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center"></td>
                  <td className="px-4 py-3 text-sm text-center border-l">
                    {calculateOverallTotal('review2Score').toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-primary">
                    {calculateOverallTotal('finalScore').toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Confirmation Dialog */}
        <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <AlertDialogContent data-testid="dialog-submit-confirmation">
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn nộp bài đánh giá không? Sau khi nộp, bạn sẽ không thể chỉnh sửa điểm tự chấm cho đến khi có yêu cầu giải trình.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-submit">Hủy</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSubmitEvaluation}
                disabled={submitEvaluationMutation.isPending}
                data-testid="button-confirm-submit"
              >
                {submitEvaluationMutation.isPending ? 'Đang nộp...' : 'Xác nhận nộp'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedCriteria && (
          <>
            <ScoringModal
              open={scoringModalOpen}
              onClose={() => setScoringModalOpen(false)}
              criteriaName={selectedCriteria.name}
              maxScore={selectedCriteria.maxScore}
              currentScore={selectedCriteria.selfScore}
              currentFile={selectedCriteria.selfScoreFile}
              onSave={handleSaveScore}
            />
            <ReviewModal
              open={reviewModalOpen}
              onClose={() => setReviewModalOpen(false)}
              criteriaName={selectedCriteria.name}
              maxScore={selectedCriteria.maxScore}
              selfScore={selectedCriteria.selfScore}
              currentReviewScore={reviewType === "review1" ? selectedCriteria.review1Score : selectedCriteria.review2Score}
              currentComment={reviewType === "review1" ? selectedCriteria.review1Comment : selectedCriteria.review2Comment}
              currentFile={reviewType === "review1" ? selectedCriteria.review1File : selectedCriteria.review2File}
              reviewType={reviewType}
              onSave={handleSaveReview}
            />
          </>
        )}
        </>
      )}
    </div>
  );
}
