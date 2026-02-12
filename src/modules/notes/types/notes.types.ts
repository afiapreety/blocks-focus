export interface Note {
  ItemId: string;
  CreatedBy?: string;
  CreatedDate?: string;
  IsDeleted?: boolean;
  Language?: string;
  LastUpdatedBy?: string;
  LastUpdatedDate?: string;
  OrganizationIds?: string[];
  Tags?: string[];
  DeletedDate?: string;
  Title: string;
  Content: string;
  IsPrivate: boolean;
  WordCount?: number;
  CharacterCount?: number;
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
  Title: string;
  Content: string;
  IsPrivate: boolean;
  WordCount?: number;
  CharacterCount?: number;
  Tags?: string[];
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
  Title?: string;
  Content?: string;
  IsPrivate?: boolean;
  WordCount?: number;
  CharacterCount?: number;
  Tags?: string[];
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
