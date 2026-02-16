import { useState } from 'react';
import { Download, Share2, Trash2, MoreHorizontal, Link, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui-kit/dropdown-menu';

interface NoteActionsMenuProps {
  onDownload: (format: 'txt' | 'md' | 'pdf') => void;
  onShare?: (type: 'link' | 'clipboard') => void;
  onDelete?: () => void;
  className?: string;
  showShare?: boolean;
  showDelete?: boolean;
  showClipboardShare?: boolean;
  stopPropagation?: boolean;
}

export function NoteActionsMenu({
  onDownload,
  onShare,
  onDelete,
  className,
  showShare = true,
  showDelete = true,
  showClipboardShare = true,
  stopPropagation = false,
}: NoteActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDownloadAction = (format: 'txt' | 'md' | 'pdf') => {
    onDownload(format);
    setMenuOpen(false);
  };

  const handleShareAction = (type: 'link' | 'clipboard') => {
    if (onShare) {
      onShare(type);
    }
    setMenuOpen(false);
  };

  const handleDeleteAction = () => {
    if (onDelete) {
      onDelete();
    }
    setMenuOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild onClick={handleClick}>
        <Button variant="ghost" size="icon" className={className || 'h-8 w-8'}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={handleClick}>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleDownloadAction('txt')}>
              Plain text (.txt)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadAction('md')}>
              Plain text (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadAction('pdf')}>
              PDF document (.pdf)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {showShare && onShare && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleShareAction('link')}>
                <Link className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              {showClipboardShare && (
                <DropdownMenuItem onClick={() => handleShareAction('clipboard')}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy to clipboard
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {showDelete && onDelete && (
          <DropdownMenuItem onClick={handleDeleteAction} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
