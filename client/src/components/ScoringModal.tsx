import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScoringModalProps {
  open: boolean;
  onClose: () => void;
  criteriaName: string;
  maxScore: number;
  criteriaType: number; // 1=định lượng, 2=định tính, 3=nhập thẳng, 4=cộng/trừ
  currentScore?: number;
  currentFile?: string;
  currentTargetValue?: number;
  currentActualValue?: number;
  onSave: (data: {
    score?: number;
    file?: File | null;
    targetValue?: number;
    actualValue?: number;
    achieved?: boolean;
  }) => void;
}

export default function ScoringModal({
  open,
  onClose,
  criteriaName,
  maxScore,
  criteriaType,
  currentScore,
  currentFile,
  currentTargetValue,
  currentActualValue,
  onSave,
}: ScoringModalProps) {
  // Common states
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(currentFile || "");
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  // Type 1 (Định lượng) states
  const [targetValue, setTargetValue] = useState(currentTargetValue?.toString() || "");
  const [actualValue, setActualValue] = useState(currentActualValue?.toString() || "");

  // Type 2 (Định tính) states
  const [achieved, setAchieved] = useState<string>("true"); // "true" or "false"

  // Type 3 & 4 (Nhập thẳng / Cộng trừ) states
  const [score, setScore] = useState(currentScore?.toString() || "");

  useEffect(() => {
    if (open) {
      setFile(null);
      setFileName(currentFile || "");
      setErrors({});
      
      // Reset based on criteria type
      if (criteriaType === 1) {
        setTargetValue(currentTargetValue?.toString() || "");
        setActualValue(currentActualValue?.toString() || "");
      } else if (criteriaType === 2) {
        setAchieved(currentScore === maxScore ? "true" : "false");
      } else {
        setScore(currentScore?.toString() || "");
      }
    }
  }, [open, currentScore, currentFile, currentTargetValue, currentActualValue, criteriaType, maxScore]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: "Kích thước file không được vượt quá 10MB" }));
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setErrors(prev => ({ ...prev, file: undefined }));
  };

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate based on criteria type
    if (criteriaType === 1) {
      // Định lượng: Validate target and actual
      const target = parseFloat(targetValue);
      const actual = parseFloat(actualValue);
      
      if (!targetValue || isNaN(target) || target <= 0) {
        newErrors.targetValue = "Vui lòng nhập chỉ tiêu hợp lệ (> 0)";
      }
      
      if (!actualValue || isNaN(actual) || actual < 0) {
        newErrors.actualValue = "Vui lòng nhập kết quả thực hiện (≥ 0)";
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      onSave({
        targetValue: target,
        actualValue: actual,
        file: file || undefined,
      });
    } else if (criteriaType === 2) {
      // Định tính: No validation needed, just pass achieved status
      const isAchieved = achieved === "true";
      onSave({
        achieved: isAchieved,
        score: isAchieved ? maxScore : 0,
        file: file || undefined,
      });
    } else if (criteriaType === 3) {
      // Nhập thẳng: Validate score <= maxScore
      const numScore = parseFloat(score);
      
      if (!score || isNaN(numScore)) {
        newErrors.score = "Vui lòng nhập điểm";
      } else if (numScore < 0 || numScore > maxScore) {
        newErrors.score = `Điểm phải từ 0 đến ${maxScore}`;
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      onSave({
        score: numScore,
        file: file || undefined,
      });
    } else if (criteriaType === 4) {
      // Cộng/trừ: Allow negative scores
      const numScore = parseFloat(score);
      
      if (!score || isNaN(numScore)) {
        newErrors.score = "Vui lòng nhập điểm";
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      onSave({
        score: numScore,
        file: file || undefined,
      });
    }
    
    onClose();
  };

  const getCriteriaTypeLabel = () => {
    switch (criteriaType) {
      case 1: return "Định lượng";
      case 2: return "Định tính";
      case 3: return "Nhập thẳng";
      case 4: return "Cộng/Trừ điểm";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px]" data-testid="modal-scoring">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Chấm điểm tiêu chí ({getCriteriaTypeLabel()})
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {criteriaName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* TYPE 1: Định lượng - Input target + actual */}
          {criteriaType === 1 && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Tiêu chí định lượng
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-sm font-medium">
                    Chỉ tiêu được giao <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => {
                      setTargetValue(e.target.value);
                      setErrors(prev => ({ ...prev, targetValue: undefined }));
                    }}
                    placeholder="Nhập chỉ tiêu"
                    className={errors.targetValue ? "border-destructive" : ""}
                    data-testid="input-target-value"
                  />
                  {errors.targetValue && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.targetValue}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actual" className="text-sm font-medium">
                    Kết quả thực hiện <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="actual"
                    type="number"
                    step="0.01"
                    value={actualValue}
                    onChange={(e) => {
                      setActualValue(e.target.value);
                      setErrors(prev => ({ ...prev, actualValue: undefined }));
                    }}
                    placeholder="Nhập kết quả"
                    className={errors.actualValue ? "border-destructive" : ""}
                    data-testid="input-actual-value"
                  />
                  {errors.actualValue && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.actualValue}
                    </p>
                  )}
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Điểm sẽ được tính tự động dựa trên tỷ lệ hoàn thành và so sánh với đơn vị dẫn đầu trong cụm.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* TYPE 2: Định tính - Radio Đạt/Không đạt + File */}
          {criteriaType === 2 && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Tiêu chí định tính
              </h4>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Kết quả đánh giá <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={achieved}
                  onValueChange={setAchieved}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-md border hover-elevate">
                    <RadioGroupItem value="true" id="achieved-yes" data-testid="radio-achieved-yes" />
                    <Label htmlFor="achieved-yes" className="flex-1 cursor-pointer">
                      <span className="font-medium text-green-700 dark:text-green-300">✓ Đạt</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (Nhận {maxScore} điểm)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-md border hover-elevate">
                    <RadioGroupItem value="false" id="achieved-no" data-testid="radio-achieved-no" />
                    <Label htmlFor="achieved-no" className="flex-1 cursor-pointer">
                      <span className="font-medium text-red-700 dark:text-red-300">✗ Không đạt</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (Nhận 0 điểm)
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* TYPE 3: Nhập thẳng - Score input (≤ maxScore) */}
          {criteriaType === 3 && (
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                Tiêu chí chấm thẳng
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="score" className="text-sm font-medium">
                  Điểm tự chấm <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={maxScore}
                    step="0.1"
                    value={score}
                    onChange={(e) => {
                      setScore(e.target.value);
                      setErrors(prev => ({ ...prev, score: undefined }));
                    }}
                    placeholder={`Nhập điểm (0 - ${maxScore})`}
                    className={`h-10 ${errors.score ? "border-destructive" : ""}`}
                    data-testid="input-modal-score"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    / {maxScore}
                  </div>
                </div>
                {errors.score && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.score}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Nhập điểm từ 0 đến {maxScore}. Có thể dùng số thập phân (VD: 0.5, 1.8)
                </p>
              </div>
            </div>
          )}

          {/* TYPE 4: Cộng/Trừ - Score input (allow negative) */}
          {criteriaType === 4 && (
            <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                Tiêu chí cộng/trừ điểm
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="score" className="text-sm font-medium">
                  Điểm cộng/trừ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="score"
                  type="number"
                  step="0.1"
                  value={score}
                  onChange={(e) => {
                    setScore(e.target.value);
                    setErrors(prev => ({ ...prev, score: undefined }));
                  }}
                  placeholder="Nhập điểm (có thể âm)"
                  className={`h-10 ${errors.score ? "border-destructive" : ""}`}
                  data-testid="input-bonus-penalty-score"
                />
                {errors.score && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.score}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Nhập điểm cộng (số dương) hoặc điểm trừ (số âm). VD: 5 hoặc -3
                </p>
              </div>
            </div>
          )}

          {/* File Upload (for all types except Type 1 which has its own section) */}
          {(criteriaType === 2 || criteriaType === 3 || criteriaType === 4) && (
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm font-medium">
                File minh chứng {criteriaType === 2 && <span className="text-muted-foreground">(tùy chọn)</span>}
              </Label>
              <div className="flex flex-col gap-2">
                {fileName ? (
                  <div className="flex items-center gap-3 p-3 border rounded-md bg-accent/30 hover-elevate">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid="text-filename">
                        {fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : "Đã tải lên trước đó"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      data-testid="button-remove-file"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-md cursor-pointer hover-elevate transition-colors"
                    data-testid="label-upload"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Tải lên file minh chứng</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Kéo thả hoặc nhấp để chọn file
                      </p>
                    </div>
                  </label>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  data-testid="input-file-upload"
                />
              </div>
              {errors.file && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{errors.file}</AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Định dạng: PDF, Word (.doc, .docx), Hình ảnh (.jpg, .png) - Tối đa 10MB
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel" className="h-10">
            Hủy
          </Button>
          <Button onClick={handleSave} data-testid="button-save" className="h-10">
            Lưu điểm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
