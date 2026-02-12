import { useState } from 'react';
import { MoreHorizontal, Download, Share2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Note } from '../../types/notes.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';
import { Button } from '@/components/ui-kit/button';
import { Card, CardContent, CardHeader } from '@/components/ui-kit/card';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onDownload: (note: Note) => void;
  onShare: (note: Note) => void;
  userName?: string;
}

export function NoteCard({
  note,
  onClick,
  onDelete,
  onDownload,
  onShare,
  userName,
}: NoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuAction = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  const getPreviewText = (content: string) => {
    const text = content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1 ')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1 ')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1 ')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1 ')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1 ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const createdDate = note.CreatedDate ? new Date(note.CreatedDate) : new Date();
  const formattedDate = format(createdDate, 'yyyy-MM-dd');
  const timeAgo = getTimeAgo(createdDate);

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30 h-full"
      onClick={() => onClick(note)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-card-foreground">{formattedDate}</h3>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => handleMenuAction(() => onDownload(note))}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction(() => onShare(note))}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleMenuAction(() => onDelete(note.ItemId))}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col justify-between flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">{getPreviewText(note.Content)}</p>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{timeAgo}</span>
          <span>By {userName || note.CreatedBy || 'Unknown'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'a few seconds ago';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return format(date, 'MMM d, yyyy');
  }
}
