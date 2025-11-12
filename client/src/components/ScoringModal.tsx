import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScoringModalProps {
  open: boolean;
  onClose: () => void;
  criteriaName: string;
  maxScore: number;
  currentScore?: number;
  currentFile?: string;
  onSave: (score: number, file: File | null) => void;
}

export default function ScoringModal({
  open,
  onClose,
  criteriaName,
  maxScore,
  currentScore,
  currentFile,
  onSave,
}: ScoringModalProps) {
  const [score, setScore] = useState(currentScore?.toString() || "");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(currentFile || "");
  const [errors, setErrors] = useState<{ score?: string; file?: string }>({});

  useEffect(() => {
    if (open) {
      setScore(currentScore?.toString() || "");
      setFileName(currentFile || "");
      setFile(null);
      setErrors({});
    }
  }, [open, currentScore, currentFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (max 10MB)
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

  const handleScoreChange = (value: string) => {
    setScore(value);
    
    const numValue = parseFloat(value);
    if (value && (isNaN(numValue) || numValue < 0 || numValue > maxScore)) {
      setErrors(prev => ({ ...prev, score: `Điểm phải từ 0 đến ${maxScore}` }));
    } else {
      setErrors(prev => ({ ...prev, score: undefined }));
    }
  };

  const handleSave = () => {
    const numScore = parseFloat(score);
    
    // Validate
    if (!score || isNaN(numScore)) {
      setErrors(prev => ({ ...prev, score: "Vui lòng nhập điểm" }));
      return;
    }
    
    if (numScore < 0 || numScore > maxScore) {
      setErrors(prev => ({ ...prev, score: `Điểm phải từ 0 đến ${maxScore}` }));
      return;
    }
    
    onSave(numScore, file);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px]" data-testid="modal-scoring">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Chấm điểm tiêu chí</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{criteriaName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Score Input */}
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
                onChange={(e) => handleScoreChange(e.target.value)}
                placeholder={`Nhập điểm (0 - ${maxScore})`}
                className={`h-10 ${errors.score ? "border-destructive focus-visible:ring-destructive" : ""}`}
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

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-sm font-medium">
              File minh chứng
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
