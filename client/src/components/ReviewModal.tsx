import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText } from "lucide-react";
import { useState } from "react";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  criteriaName: string;
  maxScore: number;
  selfScore?: number;
  currentReviewScore?: number;
  currentComment?: string;
  currentFile?: string;
  reviewType: "review1" | "review2";
  onSave: (score: number, comment: string, file: File | null) => void;
}

export default function ReviewModal({
  open,
  onClose,
  criteriaName,
  maxScore,
  selfScore,
  currentReviewScore,
  currentComment,
  currentFile,
  reviewType,
  onSave,
}: ReviewModalProps) {
  const [score, setScore] = useState(currentReviewScore || 0);
  const [comment, setComment] = useState(currentComment || "");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(currentFile || "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
  };

  const handleSave = () => {
    onSave(score, comment, file);
    onClose();
  };

  const title = reviewType === "review1" ? "Thẩm định lần 1" : "Thẩm định lần 2";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-review">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{criteriaName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {selfScore !== undefined && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Điểm tự chấm: <span className="font-semibold text-foreground">{selfScore.toFixed(2)}</span></p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-score">Điểm thẩm định (Tối đa: {maxScore})</Label>
            <Input
              id="review-score"
              type="number"
              min="0"
              max={maxScore}
              step="0.1"
              value={score}
              onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
              data-testid="input-modal-review-score"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập nhận xét về tiêu chí này..."
              rows={4}
              data-testid="textarea-modal-comment"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload-review">File đính kèm</Label>
            <div className="flex flex-col gap-2">
              {fileName ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm flex-1 truncate" data-testid="text-review-filename">
                    {fileName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    data-testid="button-remove-review-file"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="file-upload-review"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                  data-testid="label-review-upload"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Chọn file để tải lên</span>
                </label>
              )}
              <input
                id="file-upload-review"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-testid="input-review-file-upload"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Chấp nhận: PDF, Word, hình ảnh (tối đa 10MB)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-review-cancel">
            Hủy
          </Button>
          <Button onClick={handleSave} data-testid="button-review-save">
            Lưu thẩm định
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
