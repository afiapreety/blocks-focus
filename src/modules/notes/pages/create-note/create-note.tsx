import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Lock, Globe, MoreHorizontal } from 'lucide-react';
import { useAddNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { Badge } from '@/components/ui-kit/badge';

export function CreateNotePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: addNote, isPending } = useAddNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate] = useState(true);

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

    addNote(
      {
        input: {
          Title: title,
          Content: content,
          IsPrivate: isPrivate,
          WordCount: wordCount,
          CharacterCount: characterCount,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] === 'notes',
          });
          toast({
            variant: 'success',
            title: 'Note created',
            description: 'Note created successfully',
          });

          const createdNoteId = data?.insertNoteItem?.itemId;
          if (createdNoteId) {
            navigate(`/notes/${createdNoteId}`);
          } else {
            navigate('/notes');
          }
        },
        onError: (error) => {
          console.error('Error creating note:', error);
          toast({
            variant: 'destructive',
            title: 'Failed to create note',
            description: 'Unable to create note',
          });
        },
      }
    );
  };

  const currentDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] w-full rounded-lg bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
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
          className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 mb-4 bg-transparent text-card-foreground placeholder:text-muted-foreground"
        />

        <Textarea
          placeholder="Write something..."
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          className="min-h-[400px] border-none shadow-none focus-visible:ring-0 px-0 resize-none text-base bg-transparent text-card-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="p-4 border-t border-border flex items-center justify-end">
        <Button onClick={handleSave} disabled={!title.trim() || isPending} loading={isPending}>
          Save Note
        </Button>
      </div>
    </div>
  );
}
