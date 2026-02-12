import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Globe,
  Undo2,
  Redo2,
  SlidersHorizontal,
  MoreHorizontal,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAddNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import { NotesEditor } from '../../components/notes-editor/notes-editor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';
import { GroupedModelSelector } from '@/modules/gpt-chats/components/gpt-chat-input/model-selector';
import { AIChatSheet } from '../../components/notes-ask-ai/notes-ask-ai';

export function CreateNotePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: addNote, isPending } = useAddNote();

  const [content, setContent] = useState('');
  const [isPrivate] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);

  const extractTitle = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const firstElement = tempDiv.querySelector('h1, h2, h3, p');
    return firstElement?.textContent?.trim() || 'Untitled Note';
  };

  const getPlainText = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  };

  const plainText = getPlainText(content);
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = plainText.length;

  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), "'Today at' h:mm a");

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

            {/* AI Settings Dropdown */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[400px] p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold">AI Model</label>
                        </div>

                        <div
                          className="
              [&_.w-\[220px\]]:w-full
              [&_.rounded-xl]:rounded-lg
              [&_.w-\[95vw\]]:w-full
              [&_.sm\:w-\[420px\]]:w-[280px]
              [&_.h-\[320px\]]:h-[280px]
              [&_.sm\:w-\[200px\]]:w-[100px]
              [&_.group\/model]:!border-0
              [&_.group\/model]:p-2
              [&_.group\/model]:rounded-lg
              [&_.group\/model]:w-full
              [&_.group\/model.border-primary]:!border-0
              [&_.group\/model.bg-primary\/10]:bg-accent
              [&_.group\/model.bg-primary\/10]:!border-0
              [&_.group\/model.bg-primary\/10]:relative
              [&_.group\/model.bg-primary\/10]:before:absolute
              [&_.group\/model.bg-primary\/10]:before:left-0
              [&_.group\/model.bg-primary\/10]:before:top-1/2
              [&_.group\/model.bg-primary\/10]:before:-translate-y-1/2
              [&_.group\/model.bg-primary\/10]:before:w-[3px]
              [&_.group\/model.bg-primary\/10]:before:h-[60%]
              [&_.group\/model.bg-primary\/10]:before:bg-primary
              [&_.group\/model.bg-primary\/10]:before:rounded-r-full
              [&_.group\/model]:hover:bg-accent/80
              [&_.flex.flex-row.flex-wrap]:flex-col
              [&_.flex.flex-row.flex-wrap]:gap-1
            "
                        >
                          <GroupedModelSelector value={selectedModel} onChange={setSelectedModel} />
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Enhance with AI */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enhance with AI</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Chat Sheet */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <AIChatSheet />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ask AI</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
