import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText } from "lucide-react";
import { useState } from "react";

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
  const [score, setScore] = useState(currentScore || 0);
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
    onSave(score, file);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-scoring">
        <DialogHeader>
          <DialogTitle>Chấm điểm tiêu chí</DialogTitle>
          <DialogDescription>{criteriaName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="score">Điểm tự chấm (Tối đa: {maxScore})</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max={maxScore}
              step="0.1"
              value={score}
              onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
              data-testid="input-modal-score"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">File đính kèm</Label>
            <div className="flex flex-col gap-2">
              {fileName ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm flex-1 truncate" data-testid="text-filename">
                    {fileName}
                  </span>
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
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                  data-testid="label-upload"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Chọn file để tải lên</span>
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
            <p className="text-xs text-muted-foreground">
              Chấp nhận: PDF, Word, hình ảnh (tối đa 10MB)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Hủy
          </Button>
          <Button onClick={handleSave} data-testid="button-save">
            Lưu điểm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
