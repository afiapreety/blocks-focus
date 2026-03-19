import { graphqlClient } from '@/lib/graphql-client';
import { GET_NOTES_QUERY } from '../graphql/queries';
import {
  INSERT_NOTE_MUTATION,
  UPDATE_NOTE_MUTATION,
  DELETE_NOTE_MUTATION,
} from '../graphql/mutations';
import {
  AddNoteParams,
  AddNoteResponse,
  UpdateNoteParams,
  UpdateNoteResponse,
  DeleteNoteResponse,
  Note,
} from '../types/notes.types';

const normalizeNote = (note: Note): Note => {
  if (note.NoteData?.NoteContent?.html) {
    if (!note.Title) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = note.NoteData.NoteContent.html;
      const firstElement = tempDiv.querySelector('h1, h2, h3, p');
      note.Title = firstElement?.textContent?.trim() || 'Untitled Note';
    }

    if (!note.Content) {
      note.Content = note.NoteData.NoteContent.html;
    }
  }

  return note;
};

interface NotesData {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  totalPages: number;
  pageSize: number;
  pageNo: number;
  items: Note[];
}

type GetNotesContext = {
  queryKey: readonly [string, { pageNo: number; pageSize: number; searchQuery?: string }];
};

export const getNotes = async (context: GetNotesContext) => {
  try {
    const [, { pageNo, pageSize, searchQuery }] = context.queryKey;

    let filter = '{}';
    if (searchQuery && searchQuery.trim() !== '') {
      filter = JSON.stringify({
        $or: [
          { 'NoteData.NoteContent.html': { $regex: searchQuery, $options: 'i' } },
          { 'NoteData.NoteContent.md': { $regex: searchQuery, $options: 'i' } },
        ],
      });
    }

    const response = await graphqlClient.query<{
      getNoteItems?: NotesData;
      NoteItems?: NotesData;
      noteItems?: NotesData;
    }>({
      query: GET_NOTES_QUERY,
      variables: {
        input: {
          filter,
          sort: JSON.stringify({ CreatedDate: -1 }),
          pageNo,
          pageSize,
        },
      },
    });

    const responseData = (response as any)?.data || response;

    let notes: NotesData | null = null;
    if (responseData && typeof responseData === 'object') {
      if ('getNoteItems' in responseData) {
        notes = responseData.getNoteItems as NotesData;
      } else if ('NoteItems' in responseData) {
        notes = responseData.NoteItems as NotesData;
      } else if ('noteItems' in responseData) {
        notes = responseData.noteItems as NotesData;
      }
    }

    if (!notes || typeof notes !== 'object') {
      const errorMessage = 'Invalid response structure: Missing getNoteItems';
      console.error('Invalid response structure:', { response: responseData });
      throw new Error(`Failed to fetch notes: ${errorMessage}`);
    }

    const result = {
      hasNextPage: Boolean(notes?.hasNextPage ?? false),
      hasPreviousPage: Boolean(notes?.hasPreviousPage ?? false),
      totalCount: Number(notes?.totalCount ?? 0),
      totalPages: Number(notes?.totalPages ?? 0),
      pageSize: Number(notes?.pageSize ?? pageSize),
      pageNo: Number(notes?.pageNo ?? pageNo),
      items: Array.isArray(notes?.items) ? notes.items.map(normalizeNote) : [],
    };

    return result;
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: 'Unknown error' };

    console.error('Error in getNotes:', errorDetails);

    throw new Error(
      error instanceof Error
        ? `Failed to fetch notes: ${error.message}`
        : 'An unknown error occurred while fetching notes'
    );
  }
};

export const getNoteById = async (noteId: string): Promise<Note> => {
  try {
    const response = await graphqlClient.query<{
      getNoteItems?: { items: Note[] };
      NoteItems?: { items: Note[] };
      noteItems?: { items: Note[] };
    }>({
      query: GET_NOTES_QUERY,
      variables: {
        input: {
          filter: '{}',
          sort: JSON.stringify({ CreatedDate: -1 }),
          pageNo: 1,
          pageSize: 100,
        },
      },
    });

    const responseData = (response as any)?.data || response;

    let items: Note[] = [];
    if (responseData && typeof responseData === 'object') {
      if ('getNoteItems' in responseData && responseData.getNoteItems?.items) {
        items = responseData.getNoteItems.items;
      } else if ('NoteItems' in responseData && responseData.NoteItems?.items) {
        items = responseData.NoteItems.items;
      } else if ('noteItems' in responseData && responseData.noteItems?.items) {
        items = responseData.noteItems.items;
      }
    }

    const note = items.find((item) => item.ItemId === noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    return normalizeNote(note);
  } catch (error) {
    console.error('Error in getNoteById:', error);
    throw error;
  }
};

export const addNote = async (params: AddNoteParams): Promise<AddNoteResponse> => {
  const response = await graphqlClient.mutate<AddNoteResponse>({
    query: INSERT_NOTE_MUTATION,
    variables: params,
  });

  return response;
};

export const updateNote = async (params: UpdateNoteParams): Promise<UpdateNoteResponse> => {
  const response = await graphqlClient.mutate<UpdateNoteResponse>({
    query: UPDATE_NOTE_MUTATION,
    variables: params,
  });
  return response;
};

export const deleteNote = async (
  filter: string,
  input: { isHardDelete: boolean }
): Promise<DeleteNoteResponse> => {
  const response = await graphqlClient.mutate<DeleteNoteResponse>({
    query: DELETE_NOTE_MUTATION,
    variables: { filter, input },
  });
  return response;
};
