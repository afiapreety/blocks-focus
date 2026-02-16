import { format } from 'date-fns';
import { Note } from '../../types/notes.types';
import { Card, CardContent, CardHeader } from '@/components/ui-kit/card';
import { getPreviewText, getTimeAgo } from '../../utils/notes.utils';
import { NoteActionsMenu } from '../note-actions-menu/note-actions-menu';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onDownload: (note: Note, format: 'txt' | 'md' | 'pdf') => void;
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
  const createdDate = note.CreatedDate ? new Date(note.CreatedDate) : new Date();
  const formattedDate = format(createdDate, 'yyyy-MM-dd');
  const timeAgo = getTimeAgo(createdDate);

  const handleDownload = (format: 'txt' | 'md' | 'pdf') => {
    onDownload(note, format);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = (_type: 'link' | 'clipboard') => {
    // Note-card only supports copying link
    onShare(note);
  };

  const handleDelete = () => {
    onDelete(note.ItemId);
  };

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30 h-full"
      onClick={() => onClick(note)}
    >
      <CardHeader className="!pb-2">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-card-foreground">{formattedDate}</h3>
          <NoteActionsMenu
            onDownload={handleDownload}
            onShare={handleShare}
            onDelete={handleDelete}
            className="h-6 w-6 -mt-1 -mr-1"
            showClipboardShare={false}
            stopPropagation
          />
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
