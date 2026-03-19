import { useGlobalQuery, useGlobalMutation } from '@/state/query-client/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { getNotes, addNote, updateNote, deleteNote, getNoteById } from '../services/notes.service';
import { AddNoteParams, UpdateNoteParams, Note } from '../types/notes.types';

interface NoteQueryParams {
  pageNo: number;
  pageSize: number;
  searchQuery?: string;
}

type NotesData = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  totalPages: number;
  pageSize: number;
  pageNo: number;
  items: Note[];
};

const fetchNotes = async ({
  queryKey,
}: {
  queryKey: readonly [string, NoteQueryParams];
}): Promise<NotesData> => {
  const [, params] = queryKey;
  return getNotes({
    queryKey: [
      'notes',
      {
        pageNo: params.pageNo,
        pageSize: params.pageSize,
        searchQuery: params.searchQuery,
      },
    ],
  });
};

export const useGetNotes = (params: NoteQueryParams) => {
  const { toast } = useToast();

  return useGlobalQuery<NotesData, Error, NotesData, ['notes', NoteQueryParams]>({
    queryKey: ['notes', params],
    queryFn: async ({ queryKey }) => {
      try {
        return await fetchNotes({ queryKey });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'COULD_NOT_RETRIEVE_NOTES';
        console.error('Error in useGetNotes queryFn:', error);
        toast({
          variant: 'destructive',
          title: 'Unable to load notes',
          description: errorMessage,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(attempt * 1000, 3000),
    onError: (error: Error) => {
      console.error('Error in useGetNotes:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to load notes',
        description: 'Could not retrieve notes',
      });
    },
  });
};

export const useGetNoteById = (noteId: string) => {
  const { toast } = useToast();

  return useGlobalQuery<Note, Error, Note, ['note', string]>({
    queryKey: ['note', noteId],
    queryFn: async () => {
      try {
        return await getNoteById(noteId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'COULD_NOT_RETRIEVE_NOTE';
        console.error('Error in useGetNoteById queryFn:', error);
        toast({
          variant: 'destructive',
          title: 'Unable to load note',
          description: errorMessage,
        });
        throw error;
      }
    },
    enabled: !!noteId && noteId.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();

  return useGlobalMutation({
    mutationFn: (params: AddNoteParams) => addNote(params),
    onSuccess: () => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === 'notes',
      });
    },
    onError: (error) => {
      throw error;
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useGlobalMutation({
    mutationFn: (params: UpdateNoteParams) => updateNote(params),
    onSuccess: () => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === 'notes' || query.queryKey[0] === 'note',
      });
    },
    onError: (error) => {
      handleError(error, { variant: 'destructive' });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  return useGlobalMutation({
    mutationFn: ({ filter, input }: { filter: string; input: { isHardDelete: boolean } }) =>
      deleteNote(filter, input),
    onMutate: async ({ filter }) => {
      const parsedFilter = JSON.parse(filter);
      const noteId = parsedFilter._id;

      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === 'notes' });

      const previousNotes = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === 'notes',
      });

      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === 'notes' },
        (oldData: any) => {
          if (!oldData?.items) return oldData;
          return {
            ...oldData,
            items: oldData.items.filter((note: Note) => note.ItemId !== noteId),
            totalCount: Math.max(0, (oldData.totalCount || 0) - 1),
          };
        }
      );

      return { previousNotes };
    },
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Note deleted',
        description: 'Note deleted successfully',
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousNotes) {
        context.previousNotes.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      handleError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'notes',
      });
    },
  });
};
