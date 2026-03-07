import { useState, useCallback } from 'react';
import { UploadCloud, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui-kit/dialog';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
}

export function FileUpload({ open, onOpenChange, onUpload }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        const isValidType =
          file.type === 'application/pdf' ||
          file.type === 'application/json' ||
          file.type === 'text/csv' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.type.startsWith('text/');
        const isValidSize = file.size <= 5 * 1024 * 1024;

        if (!isValidType) {
          toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: `${file.name} is not a supported file type`,
          });
          return false;
        }

        if (!isValidSize) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit`,
          });
          return false;
        }

        return true;
      });

      setSelectedFiles((prev) => {
        const combined = [...prev, ...validFiles];
        if (combined.length > 5) {
          toast({
            variant: 'destructive',
            title: 'Too many files',
            description: 'Maximum 5 files allowed',
          });
          return prev;
        }
        return combined;
      });
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.xml', '.html', '.css', '.js', '.ts', '.tsx', '.jsx'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  });

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No files selected',
        description: 'Please select at least one file',
      });
      return;
    }

    onUpload(selectedFiles);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add File</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Upload files to provide context for your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="h-6 w-6 mx-auto mb-4 text-muted-foreground" />
            <div className="mb-2">
              <span className="text-primary font-semibold text-sm">Click to upload</span>
              <span className="text-high-emphasis text-sm"> or drag and drop</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Add files to include them in your conversation
            </p>
            <p className="text-xs text-muted-foreground mt-1">(Max 5 files, 5MB each)</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Files added ({selectedFiles.length}/5)</p>
              <div className="grid grid-cols-2 gap-4 max-h-60">
                {selectedFiles.map((file, index) => {
                  const fileSizeKB = file.size / 1024;
                  const fileSizeDisplay =
                    fileSizeKB >= 1024
                      ? `${(fileSizeKB / 1024).toFixed(1)} MB`
                      : `${fileSizeKB.toFixed(1)} KB`;
                  return (
                    <div
                      key={index}
                      className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-muted/90 hover:bg-muted rounded-lg text-sm transition-all"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[200px] font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {fileSizeDisplay}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground shadow-sm"
                        aria-label="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
