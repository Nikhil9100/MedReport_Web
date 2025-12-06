import { useCallback, useState } from "react";
import { CloudUpload, File, X, FileText, Image as ImageIcon, AlertCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  title?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function UploadDropzone({
  onFileSelect,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024,
  title = "Drop medical report here",
  description = "PDF or image up to 10MB",
  className,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    const acceptedTypes = accept.split(",").map(t => t.trim().toLowerCase());
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidType = acceptedTypes.some(type => 
      type === fileExtension || 
      (type === ".jpg" && fileExtension === ".jpeg") ||
      (type === ".jpeg" && fileExtension === ".jpg")
    );

    if (!isValidType) {
      setError("Invalid file type. Please upload a PDF or image file.");
      return false;
    }

    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize, accept]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return FileText;
    return ImageIcon;
  };

  if (selectedFile) {
    const FileIcon = getFileIcon(selectedFile.name);
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate" data-testid="text-selected-filename">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            disabled={disabled}
            data-testid="button-clear-file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center min-h-64 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragging && "border-primary bg-primary/5 scale-[1.01]",
          !isDragging && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById("file-input")?.click()}
        data-testid="dropzone-area"
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          data-testid="input-file-upload"
        />

        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full transition-colors",
            isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <CloudUpload className="h-8 w-8" />
          </div>
          
          <div className="space-y-1.5">
            <p className="text-lg font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              PDF
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <ImageIcon className="h-3 w-3" />
              JPG
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <ImageIcon className="h-3 w-3" />
              PNG
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span data-testid="text-upload-error">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Files auto-delete after 24 hours. We never store your data permanently.</span>
      </div>
    </div>
  );
}
