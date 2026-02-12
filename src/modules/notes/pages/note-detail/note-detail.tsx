import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Lock,
  Globe,
  MoreHorizontal,
  Edit,
  Download,
  Share2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useGetNoteById, useDeleteNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/state/store/auth';
import { Button } from '@/components/ui-kit/button';
import { Badge } from '@/components/ui-kit/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui-kit/alert-dialog';
import { Skeleton } from '@/components/ui-kit/skeleton';

export function NoteDetailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : undefined;
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note, isLoading } = useGetNoteById(noteId || '');
  const { mutate: deleteNote } = useDeleteNote();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    navigate(`/notes/${noteId}/edit`);
  };

  const handleDownload = () => {
    if (!note) return;

    const content = `# ${note.Title}\n\n${note.Content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.Title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      variant: 'success',
      title: 'Note downloaded',
      description: 'Note downloaded successfully',
    });
  };

  const handleShare = () => {
    if (!note) return;

    const shareUrl = `${window.location.origin}/notes/${note.ItemId}`;

    if (navigator.share) {
      navigator
        .share({
          title: note.Title,
          text: note.Content.substring(0, 100),
          url: shareUrl,
        })
        .catch(() => undefined);
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        variant: 'success',
        title: 'Link copied',
        description: 'Note link copied to clipboard',
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!noteId) return;

    const filter = JSON.stringify({ _id: noteId });
    deleteNote(
      { filter, input: { isHardDelete: true } },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          navigate('/notes');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <div className="flex-1 p-6 w-full space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-2/3" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="pt-4 border-t">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)] w-full">
        <p className="text-muted-foreground">Note not found</p>
      </div>
    );
  }

  const wordCount = note.Content.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = note.Content.length;
  const currentDate = note.CreatedDate
    ? format(new Date(note.CreatedDate), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-full w-full rounded-lg bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/notes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <Edit className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 w-full">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentDate}</span>
          <Badge
            variant={note.IsPrivate ? 'secondary' : 'outline'}
            className="flex items-center gap-1"
          >
            {note.IsPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {note.IsPrivate ? 'Private' : 'Public'}
          </Badge>
          <span>
            {wordCount} words {characterCount} characters
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-card-foreground">{note.Title}</h1>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div
            className="whitespace-pre-wrap text-foreground/90"
            dangerouslySetInnerHTML={{ __html: note.Content }}
          />
        </div>

        {note.CreatedBy && (
          <div className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground">
            By {userName || note.CreatedBy || 'Unknown'}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
