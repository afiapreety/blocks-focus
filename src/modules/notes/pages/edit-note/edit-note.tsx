import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Undo2, Redo2 } from 'lucide-react';
import { useGetNoteById, useUpdateNote, useDeleteNote } from '../../hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui-kit/button';
import { Skeleton } from '@/components/ui-kit/skeleton';
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
import { ConfirmationModal } from '@/components/core/confirmation-modal/confirmation-modal';
import { htmlToMarkdown } from '../../utils/html-to-markdown';
import { markdownToHtml } from '../../utils/markdown-to-html';
import { useAuthStore } from '@/state/store/auth';
import { cn } from '@/lib/utils';
import { NoteAIActions } from '../../components/notes-ai/notes-ai-actions/notes-ai-actions';
import { useNoteAIEnhancement } from '../../hooks/use-notes-ai';
import { SelectModelType } from '@/modules/gpt-chats/types/chat-store.types';
import { NotesChatPanel } from '../../components/notes-ai/notes-chat-panel/notes-chat-panel';
import { useUnsavedChanges } from '../../hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '../../components/unsaved-changes-dialog/unsaved-changes-dialog';

export function EditNotePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note, isLoading } = useGetNoteById(noteId ?? '');
  const { mutate: updateNote, isPending } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [contentLoaded, setContentLoaded] = useState(false);
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
  const { handleDownload, handleShare } = useNoteActions({
    noteId,
    noteTitle: note?.Title,
    noteContent: content,
  });

  const { isEnhancing, handleEnhanceWithAI } = useNoteAIEnhancement({
    content,
    setContent,
    isMarkdownMode: true,
  });

  const { showDialog, handleClose, handleDiscard, allowNavigation } = useUnsavedChanges(
    hasUnsavedChanges,
    () => {
      setContent(initialContent);
      setHasUnsavedChanges(false);
    }
  );

  const handleModelChange = (value: SelectModelType | undefined) => {
    setSelectedModel(value);
  };

  useEffect(() => {
    if (note) {
      let loadedContent = '';
      if (note.NoteData?.NoteContent?.md) {
        loadedContent = markdownToHtml(note.NoteData.NoteContent.md);
      } else if (note.NoteData?.NoteContent?.html) {
        loadedContent = note.NoteData.NoteContent.html;
      } else if (note.Content) {
        loadedContent = note.Content;
      }
      setContent(loadedContent);
      resetHistory(loadedContent);
      setIsPrivate(note.IsPrivate ?? true);
      setContentLoaded(true);
      setTrackChanges(false);
    }
  }, [note, resetHistory]);

  useEffect(() => {
    if (contentLoaded && !trackChanges && content) {
      const timer = setTimeout(() => {
        setInitialContent(content);
        setTrackChanges(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [contentLoaded, trackChanges, content]);

  useEffect(() => {
    if (contentLoaded && trackChanges) {
      const normalizeHtml = (html: string) => {
        return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
      };

      const normalizedContent = normalizeHtml(content);
      const normalizedInitial = normalizeHtml(initialContent);
      const hasChanges = normalizedContent !== normalizedInitial;
      setHasUnsavedChanges(hasChanges);
    }
  }, [content, initialContent, contentLoaded, trackChanges]);

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

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = content.length;

  const onDownload = (format: 'txt' | 'md' | 'pdf') => {
    const title = extractTitle(content);
    const markdownContent = htmlToMarkdown(content);
    handleDownload(format, title, markdownContent);
  };

  const onShare = (type: 'link' | 'clipboard') => {
    const title = extractTitle(content);
    const markdownContent = htmlToMarkdown(content);
    handleShare(type, noteId, title, markdownContent);
  };

  const onDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (noteId) {
      allowNavigation();
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
    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Content required',
        description: 'Please write some content',
      });
      return;
    }

    if (!noteId) return;

    const markdownContent = htmlToMarkdown(content);
    const filter = JSON.stringify({ _id: noteId });
    updateNote(
      {
        filter,
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
            predicate: (query) => query.queryKey[0] === 'notes' || query.queryKey[0] === 'note',
          });
          toast({
            variant: 'success',
            title: 'Note updated',
            description: 'Note saved successfully',
          });
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

  return (
    <>
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

              <NoteActionsMenu onDownload={onDownload} onShare={onShare} onDelete={onDelete} />
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
              {contentLoaded && (
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
              )}
            </div>
          </div>
          {editorMode === 'edit' && (
            <div className="px-8 py-3 border-t border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{wordCount} words</span>
                <span>{characterCount} characters</span>
              </div>
              <Button onClick={handleSave} disabled={isPending} loading={isPending}>
                Update Note
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

      <UnsavedChangesDialog
        open={showDialog}
        onClose={handleClose}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </>
  );
}
