import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Lock, Globe, MoreHorizontal } from 'lucide-react';
import { useGetNoteById, useUpdateNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { Badge } from '@/components/ui-kit/badge';

export function EditNotePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note, isLoading } = useGetNoteById(noteId || '');
  const { mutate: updateNote } = useUpdateNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (note) {
      setTitle(note.Title || '');
      setContent(note.Content || '');
      setIsPrivate(note.IsPrivate ?? true);
    }
  }, [note]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = content.length;

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title required',
        description: 'Please enter a note title',
      });
      return;
    }

    if (!noteId) return;

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
          navigate(`/notes/${noteId}`);
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
      <div className="flex items-center justify-center h-screen w-full">
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <p className="text-muted-foreground">Note not found</p>
      </div>
    );
  }

  const currentDate = note.CreatedDate
    ? format(new Date(note.CreatedDate), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate('/notes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 w-full">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentDate}</span>
          <Badge variant={isPrivate ? 'secondary' : 'outline'} className="flex items-center gap-1">
            {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {isPrivate ? 'Private' : 'Public'}
          </Badge>
          <span>
            {wordCount} words {characterCount} characters
          </span>
        </div>

        <Input
          type="text"
          placeholder="Write something..."
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 mb-4"
        />

        <Textarea
          placeholder="Write something..."
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          className="min-h-[500px] border-none shadow-none focus-visible:ring-0 px-0 resize-none text-base"
        />
      </div>

      <div className="p-4 border-t flex items-center justify-end">
        <Button onClick={handleSave} disabled={!title.trim()}>
          Update Note
        </Button>
      </div>
    </div>
  );
}
