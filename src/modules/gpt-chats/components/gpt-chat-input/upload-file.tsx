import { useState, useCallback } from 'react';
import { UploadCloud, FileText, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Badge } from '@/components/ui-kit/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-kit/popover';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize } from '../../utils/format-file-size';

interface UploadFileProps {
  onUploadFiles?: (files: File[]) => void;
  className?: string;
}

export function UploadFile({ onUploadFiles, className }: UploadFileProps) {
  const [open, setOpen] = useState(false);
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

    onUploadFiles?.(selectedFiles);
    setSelectedFiles([]);
    setOpen(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedCount = selectedFiles.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-11 h-11 justify-center bg-gradient-to-br from-card/80 to-card/50 hover:from-card hover:to-card/80 rounded-xl p-0 group relative backdrop-blur-sm',
            className
          )}
        >
          <div className="p-1.5 rounded-lg flex-shrink-0 bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:scale-110">
            <Paperclip className="h-5 w-5 text-primary transition-transform duration-300" />
          </div>

          {selectedCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center text-[10px] font-semibold bg-gradient-to-br from-primary via-primary to-primary/90 text-white border-2 border-background hover:scale-110 animate-in zoom-in">
              {selectedCount}
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[95vw] sm:w-[480px] lg:w-[520px] p-0 rounded-2xl border-border"
        align="start"
      >
        <div className="flex flex-col max-h-[480px]">
          <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Add Files
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Upload files to provide context for your conversation
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
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
              <div className="space-y-3">
                <p className="text-sm font-semibold">Files added ({selectedFiles.length}/5)</p>
                <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto px-2 py-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition-all bg-muted/90 hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[200px] font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground shadow-sm"
                        aria-label="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-4 py-3 border-t border-border/30 bg-muted/10">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpload} disabled={selectedFiles.length === 0}>
              Upload {selectedCount > 0 && `(${selectedCount})`}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
