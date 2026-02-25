import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useGetNotes, useDeleteNote } from '../../hooks/use-notes';
import { Note } from '../../types/notes.types';
import { NotesHeader } from '../../components/notes-header/notes-header';
import { NotesSearch } from '../../components/notes-search/notes-search';
import { NotesEmptyState } from '../../components/notes-empty-state/notes-empty-state';
import { NoteCard } from '../../components/note-card/note-card';
import { useNoteActions } from '../../hooks/use-note-actions';
import { useAuthStore } from '@/state/store/auth';
import { ConfirmationModal } from '@/components/core/confirmation-modal/confirmation-modal';
import { Skeleton } from '@/components/ui-kit/skeleton';

export function NotesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { handleDownload: downloadNote, handleShare: shareNote } = useNoteActions();
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : undefined;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const { data: notesData, isLoading } = useGetNotes({
    pageNo: 1,
    pageSize: 100,
    searchQuery: debouncedSearchQuery,
  });

  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();

  // Filter notes by current user
  const userNotes = useMemo(() => {
    const allNotes = notesData?.items ?? [];
    if (!user?.itemId) return allNotes;
    return allNotes.filter((note) => note.UserId === user.itemId);
  }, [notesData?.items, user?.itemId]);

  const totalCount = userNotes.length;

  const groupedNotes = useMemo(() => {
    const notes = userNotes;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: { [key: string]: Note[] } = {
      Today: [],
    };

    notes.forEach((note) => {
      const noteDate = note.CreatedDate ? new Date(note.CreatedDate) : new Date();
      noteDate.setHours(0, 0, 0, 0);

      if (noteDate.getTime() === today.getTime()) {
        groups.Today.push(note);
      } else {
        const dateKey = format(noteDate, 'yyyy-MM-dd');
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(note);
      }
    });

    return groups;
  }, [userNotes]);

  const handleNoteClick = (note: Note) => {
    navigate(`/notes/${note.ItemId}`);
  };

  const handleDeleteClick = (noteId: string) => {
    setDeleteNoteId(noteId);
  };

  const handleConfirmDelete = () => {
    if (deleteNoteId) {
      const filter = JSON.stringify({ _id: deleteNoteId });
      deleteNote(
        { filter, input: { isHardDelete: true } },
        {
          onSuccess: () => {
            setDeleteNoteId(null);
          },
        }
      );
    }
  };

  const handleDownload = (note: Note, format: 'txt' | 'md' | 'pdf' = 'md') => {
    downloadNote(format, note.Title, note.Content);
  };

  const handleShare = (note: Note) => {
    shareNote('link', note.ItemId, note.Title, note.Content);
  };

  return (
    <div className="flex w-full gap-5 flex-col bg-gradient-to-b from-background to-muted/20 overflow-y-auto p-4 sm:p-6 md:p-8">
      <NotesHeader />
      <NotesSearch value={searchQuery} onChange={setSearchQuery} />

      {isLoading || isDeleting ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : totalCount === 0 && !debouncedSearchQuery ? (
        <NotesEmptyState />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotes).map(([dateKey, groupNotes]) => {
            if (groupNotes.length === 0) return null;

            return (
              <div key={dateKey}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  {dateKey === 'Today' ? dateKey : format(new Date(dateKey), 'yyyy-MM-dd')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupNotes.map((note) => (
                    <NoteCard
                      key={note.ItemId}
                      note={note}
                      onClick={handleNoteClick}
                      onDelete={handleDeleteClick}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      userName={userName}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {totalCount === 0 && debouncedSearchQuery && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No notes found matching your search.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        open={!!deleteNoteId}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
