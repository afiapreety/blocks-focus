export interface NoteContent {
  md: string;
  html: string;
}

export interface NoteData {
  Files?: string[];
  NoteContent: NoteContent;
}

export interface NoteUser {
  UserId: string;
  Name: string;
  Roles: string;
  Email: string;
}

export interface Note {
  ItemId: string;
  CreatedDate?: string;
  CreatedBy?: string;
  LastUpdatedDate?: string;
  LastUpdatedBy?: string;
  IsDeleted?: boolean;
  Language?: string;
  OrganizationIds?: string[];
  Tags?: string[];
  DeletedDate?: string;
  IsPrivate: boolean;
  WordCount?: number;
  CharacterCount?: number;
  AccessControl?: string;
  UserId?: string;
  NoteData: NoteData;
  NoteUser?: NoteUser;
  Title?: string;
  Content?: string;
}

export interface GetNotesResponse {
  getNoteItems: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount: number;
    totalPages: number;
    pageSize: number;
    pageNo: number;
    items: Note[];
  };
}

export interface GetNoteResponse {
  getNoteItems: {
    items: Note[];
  };
}

export interface AddNoteInput {
  IsPrivate: boolean;
  WordCount?: number;
  CharacterCount?: number;
  Tags?: string[];
  AccessControl?: string;
  UserId?: string;
  NoteData: NoteData;
  NoteUser?: NoteUser;
}

export interface AddNoteParams {
  input: AddNoteInput;
}

export interface AddNoteResponse {
  insertNoteItem: {
    itemId: string;
    totalImpactedData: number;
    acknowledged: boolean;
  };
}

export interface UpdateNoteInput {
  IsPrivate?: boolean;
  WordCount?: number;
  CharacterCount?: number;
  Tags?: string[];
  AccessControl?: string;
  UserId?: string;
  NoteData?: NoteData;
  NoteUser?: NoteUser;
}

export interface UpdateNoteParams {
  filter: string;
  input: UpdateNoteInput;
}

export interface UpdateNoteResponse {
  updateNoteItem: {
    itemId: string;
    totalImpactedData: number;
    acknowledged: boolean;
  };
}

export interface DeleteNoteResponse {
  deleteNoteItem: {
    itemId: string;
    totalImpactedData: number;
    acknowledged: boolean;
  };
}
