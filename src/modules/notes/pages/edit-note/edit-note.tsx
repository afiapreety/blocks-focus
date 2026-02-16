import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Globe, Undo2, Redo2, Calendar, Users } from 'lucide-react';
import { useGetNoteById, useUpdateNote, useDeleteNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { NotesEditor } from '../../components/notes-editor/notes-editor';
import { NoteAIActions } from '../../components/notes-ai/notes-ai-actions/notes-ai-actions';
import { useNoteAIEnhancement } from '../../hooks/use-notes-ai';
import { SelectModelType } from '@/modules/gpt-chats/hooks/use-chat-store';
import { useQuillHistory } from '../../hooks/use-quill-history';
import { NoteActionsMenu } from '../../components/note-actions-menu/note-actions-menu';
import { useNoteActions } from '../../hooks/use-note-actions';
import { ConfirmationModal } from '@/components/core/confirmation-modal/confirmation-modal';

export function EditNotePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note, isLoading } = useGetNoteById(noteId || '');
  const { mutate: updateNote, isPending } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SelectModelType | undefined>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
  });

  const { canUndo, canRedo, handleQuillReady, handleUndo, handleRedo } = useQuillHistory();
  const { handleDownload, handleShare } = useNoteActions({
    noteId,
    noteTitle: note?.Title,
    noteContent: content,
  });

  const getPlainText = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  };

  const { isEnhancing, handleEnhanceWithAI } = useNoteAIEnhancement({
    content,
    setContent,
    getPlainText,
  });

  useEffect(() => {
    if (note) {
      setContent(note.Content || '');
      setIsPrivate(note.IsPrivate ?? true);
    }
  }, [note]);

  const extractTitle = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const firstElement = tempDiv.querySelector('h1, h2, h3, p');
    return firstElement?.textContent?.trim() || 'Untitled Note';
  };

  const plainText = getPlainText(content);
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = plainText.length;

  const handleModelChange = (value: SelectModelType) => {
    setSelectedModel(value);
  };

  const onDownload = (format: 'txt' | 'md' | 'pdf') => {
    const title = extractTitle(content);
    handleDownload(format, title, content);
  };

  const onShare = (type: 'link' | 'clipboard') => {
    const title = extractTitle(content);
    handleShare(type, noteId, title, content);
  };

  const onDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (noteId) {
      const filter = JSON.stringify({ _id: noteId });
      deleteNote(
        { filter, input: { isHardDelete: true } },
        {
          onSuccess: () => {
            toast({
              variant: 'success',
              title: 'Note deleted',
              description: 'Note deleted successfully',
            });
            navigate('/notes');
          },
          onError: () => {
            toast({
              variant: 'destructive',
              title: 'Failed to delete note',
              description: 'Unable to delete note',
            });
          },
        }
      );
    }
    setShowDeleteDialog(false);
  };

  const handleSave = () => {
    if (!content.trim() || content === '<p><br></p>') {
      toast({
        variant: 'destructive',
        title: 'Content required',
        description: 'Please write some content',
      });
      return;
    }

    if (!noteId) return;

    const title = extractTitle(content);

    const filter = JSON.stringify({ _id: noteId });
    updateNote(
      {
        filter,
        input: {
          Title: title,
          Content: content,
          IsPrivate: isPrivate,
          WordCount: wordCount,
          CharacterCount: characterCount,
        },
      },
      {
        onSuccess: () => {
          queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] === 'notes' || query.queryKey[0] === 'note',
          });
          toast({
            variant: 'success',
            title: 'Note updated',
            description: 'Note updated successfully',
          });
          navigate('/notes');
        },
        onError: (error) => {
          console.error('Error updating note:', error);
          toast({
            variant: 'destructive',
            title: 'Failed to update note',
            description: 'Unable to update note',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
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
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-end">
          <Skeleton className="h-9 w-28 rounded-md" />
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

  const currentDate = note.CreatedDate
    ? format(new Date(note.CreatedDate), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');
  const currentTime = note.CreatedDate
    ? format(new Date(note.CreatedDate), "'Today at' h:mm a")
    : format(new Date(), "'Today at' h:mm a");

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] w-full rounded-lg bg-card">
      <div className="flex-1 overflow-y-auto p-6 w-full">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-card-foreground">{currentDate}</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            <NoteAIActions
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              onEnhance={() => handleEnhanceWithAI(selectedModel)}
              isEnhancing={isEnhancing}
            />

            <NoteActionsMenu onDownload={onDownload} onShare={onShare} onDelete={onDelete} />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {currentTime}
          </span>
          <span className="flex items-center gap-1">
            {isPrivate ? <Users className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            {isPrivate ? 'Private' : 'Public'}
          </span>
          <span>
            {wordCount} words {characterCount} characters
          </span>
        </div>

        <NotesEditor
          value={content}
          onChange={setContent}
          placeholder="Write something..."
          onQuillReady={handleQuillReady}
        />
      </div>

      <div className="p-4 border-t border-border flex items-center justify-end">
        <Button onClick={handleSave} disabled={isPending} loading={isPending}>
          Update Note
        </Button>
      </div>

      <ConfirmationModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
