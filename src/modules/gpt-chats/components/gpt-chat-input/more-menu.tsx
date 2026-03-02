import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { cn } from '@/lib/utils';
import { FileUpload } from '../modals/file-upload/file-upload';

interface MoreMenuProps {
  onUploadFiles?: (files: File[]) => void;
  className?: string;
}

export function MoreMenu({ onUploadFiles, className }: MoreMenuProps) {
  const [open, setOpen] = useState(false);

  const handleUpload = (files: File[]) => {
    onUploadFiles?.(files);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn(
          'h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground',
          className
        )}
      >
        <Plus className="h-5 w-5" />
      </Button>
      <FileUpload open={open} onOpenChange={setOpen} onUpload={handleUpload} />
    </>
  );
}
