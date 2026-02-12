import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Globe, Undo2, Redo2, MoreHorizontal, Calendar, Users } from 'lucide-react';

import { useAddNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import { NotesEditor } from '../../components/notes-editor/notes-editor';

import { SelectModelType } from '@/modules/gpt-chats/hooks/use-chat-store';
import { NoteAIActions } from '../../components/notes-ai/notes-ai-actions/notes-ai-actions';
import { useNoteAIEnhancement } from '../../hooks/use-notes-ai';

export function CreateNotePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: addNote, isPending } = useAddNote();

  const [content, setContent] = useState('');
  const [isPrivate] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SelectModelType | undefined>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
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

  const extractTitle = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const firstElement = tempDiv.querySelector('h1, h2, h3, p');
    return firstElement?.textContent?.trim() || 'Untitled Note';
  };

  const plainText = getPlainText(content);
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = plainText.length;

  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), "'Today at' h:mm a");

  const handleModelChange = (value: SelectModelType) => {
    setSelectedModel(value);
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

    const title = extractTitle(content);

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

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] w-full rounded-lg bg-card">
      <div className="flex-1 overflow-y-auto p-6 w-full">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-card-foreground">{currentDate}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <Redo2 className="h-4 w-4" />
            </Button>

            <NoteAIActions
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              onEnhance={() => handleEnhanceWithAI(selectedModel)}
              isEnhancing={isEnhancing}
            />

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
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

        <NotesEditor value={content} onChange={setContent} placeholder="Write something..." />
      </div>

      <div className="p-4 border-t border-border flex items-center justify-end">
        <Button
          onClick={handleSave}
          disabled={!content.trim() || content === '<p><br></p>' || isPending}
          loading={isPending}
        >
          Save Note
        </Button>
      </div>
    </div>
  );
}
