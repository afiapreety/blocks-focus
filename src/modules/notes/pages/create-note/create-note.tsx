import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Undo2, Redo2 } from 'lucide-react';
import { useAddNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import { BlockEditor } from '../../components/block-editor/block-editor';
import { useMarkdownHistory } from '../../hooks/use-markdown-history';
import { NoteActionsMenu } from '../../components/note-actions-menu/note-actions-menu';
import { useNoteActions } from '../../hooks/use-note-actions';
import { useAuthStore } from '@/state/store/auth';
import { NoteAIActions } from '../../components/notes-ai/notes-ai-actions/notes-ai-actions';
import { useNoteAIEnhancement } from '../../hooks/use-notes-ai';
import { htmlToMarkdown } from '../../utils/html-to-markdown';
import { SelectModelType } from '@/modules/gpt-chats/types/chat-store.types';
import { NotesChatPanel } from '../../components/notes-ai/notes-chat-panel/notes-chat-panel';
import { cn } from '@/lib/utils';
import { useUnsavedChanges } from '../../hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '../../components/unsaved-changes-dialog/unsaved-changes-dialog';

export function CreateNotePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { mutate: addNote, isPending } = useAddNote();

  const [content, setContent] = useState('');
  const [isPrivate] = useState(true);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<SelectModelType | undefined>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
  });
  const [initialContent, setInitialContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [trackChanges, setTrackChanges] = useState(false);

  const {
    canUndo,
    canRedo,
    handleEditorReady,
    handleUndo,
    handleRedo,
    updateHistory,
    resetHistory,
  } = useMarkdownHistory();

  useEffect(() => {
    resetHistory('');
    // Start tracking changes after a delay to allow editor to initialize
    const timer = setTimeout(() => {
      setInitialContent('');
      setTrackChanges(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resetHistory]);

  useEffect(() => {
    if (trackChanges) {
      const normalizeHtml = (html: string) => {
        return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
      };

      const normalizedContent = normalizeHtml(content);
      const normalizedInitial = normalizeHtml(initialContent);

      // Extract text content to check if there's actual content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || '';
      const hasActualContent = textContent.trim().length > 0;

      const hasChanges = hasActualContent && normalizedContent !== normalizedInitial;
      setHasUnsavedChanges(hasChanges);
    }
  }, [content, initialContent, trackChanges]);
  const { handleDownload } = useNoteActions();

  const { isEnhancing, handleEnhanceWithAI } = useNoteAIEnhancement({
    content,
    setContent,
    isMarkdownMode: true,
  });

  const { showDialog, handleClose, handleDiscard, allowNavigation } = useUnsavedChanges(
    hasUnsavedChanges,
    () => {
      setContent('');
      setInitialContent('');
      setHasUnsavedChanges(false);
    }
  );

  const handleModelChange = (value: SelectModelType | undefined) => {
    setSelectedModel(value);
  };

  const extractTitle = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const firstHeading = tempDiv.querySelector('h1, h2, h3');
    if (firstHeading) {
      return firstHeading.textContent?.trim() || 'Untitled Note';
    }
    const firstPara = tempDiv.querySelector('p');
    return firstPara?.textContent?.substring(0, 50).trim() || 'Untitled Note';
  };

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const textContent = tempDiv.textContent || '';
  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = textContent.length;

  const onDownload = (format: 'txt' | 'md' | 'pdf') => {
    const title = extractTitle(content);
    const markdownContent = htmlToMarkdown(content);
    handleDownload(format, title, markdownContent);
  };

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Content required',
        description: 'Please write some content',
      });
      return;
    }

    const markdownContent = htmlToMarkdown(content);

    addNote(
      {
        input: {
          IsPrivate: isPrivate,
          WordCount: wordCount,
          CharacterCount: characterCount,
          UserId: user?.itemId,
          AccessControl: '{}',
          NoteData: {
            Files: [],
            NoteContent: {
              html: content,
              md: markdownContent,
            },
          },
          NoteUser: user
            ? {
                UserId: user.itemId,
                Name: `${user.firstName} ${user.lastName}`.trim(),
                Roles: user.roles?.join(',') || 'user',
                Email: user.email,
              }
            : undefined,
        },
      },
      {
        onSuccess: () => {
          allowNavigation(false);
          setHasUnsavedChanges(false);
          setInitialContent(content);
          queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] === 'notes',
          });
          toast({
            variant: 'success',
            title: 'Note created',
            description: 'Note saved successfully',
          });
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
    <div className="flex h-[calc(100vh-3.5rem)] w-full bg-card">
      <div className={cn('flex flex-col flex-1 min-h-0', isChatOpen ? '' : 'w-full')}>
        <div className="flex items-center justify-end px-8 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {editorMode === 'edit' && (
              <>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const previous = handleUndo();
                          if (previous !== null) setContent(previous);
                        }}
                        disabled={!canUndo}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Undo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const next = handleRedo();
                          if (next !== null) setContent(next);
                        }}
                        disabled={!canRedo}
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Redo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="h-4 w-px bg-border mx-1" />
              </>
            )}

            <NoteAIActions
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              onEnhance={() => handleEnhanceWithAI(selectedModel)}
              isEnhancing={isEnhancing}
              editorMode={editorMode}
              onChatToggle={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
            />

            <div className="h-4 w-px bg-border mx-1" />

            <NoteActionsMenu onDownload={onDownload} showShare={false} showDelete={false} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 relative">
          <div className="absolute top-4 right-8 z-10">
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setEditorMode('edit')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  editorMode === 'edit'
                    ? 'bg-background text-foreground shadow'
                    : 'hover:bg-background/50'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setEditorMode('preview')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  editorMode === 'preview'
                    ? 'bg-background text-foreground shadow'
                    : 'hover:bg-background/50'
                }`}
              >
                Read
              </button>
            </div>
          </div>

          <div className="pt-12">
            <BlockEditor
              value={content}
              onChange={(val) => {
                setContent(val);
                updateHistory(val);
              }}
              placeholder="Write anything. Enter '/' for commands"
              onEditorReady={handleEditorReady}
              readOnly={editorMode === 'preview'}
            />
          </div>
        </div>

        {editorMode === 'edit' && (
          <div className="px-8 py-3 border-t border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span>{characterCount} characters</span>
            </div>
            <Button onClick={handleSave} disabled={isPending} loading={isPending}>
              Save Note
            </Button>
          </div>
        )}
      </div>

      {isChatOpen && (
        <div className="w-[450px] flex-shrink-0">
          <NotesChatPanel
            noteContent={content}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      <UnsavedChangesDialog
        open={showDialog}
        onClose={handleClose}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}
