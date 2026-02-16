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
import { getPreviewText, getTimeAgo } from '../../utils/notes.utils';

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

  const createdDate = note.CreatedDate ? new Date(note.CreatedDate) : new Date();
  const formattedDate = format(createdDate, 'yyyy-MM-dd');
  const timeAgo = getTimeAgo(createdDate);

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30 h-full"
      onClick={() => onClick(note)}
    >
      <CardHeader className="!pb-2">
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
      <CardContent className="!pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {getPreviewText(note.Content)}
        </p>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{timeAgo}</span>
          <span>By {userName || note.CreatedBy || 'Unknown'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
