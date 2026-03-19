/**
 * GraphQL Mutations for Notes Management
 *
 * This file contains GraphQL mutation strings for notes operations.
 * These mutations are used with the graphqlClient for data modifications.
 */

export const INSERT_NOTE_MUTATION = `
  mutation InsertNoteItem($input: NoteItemInsertInput!) {
    insertNoteItem(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_NOTE_MUTATION = `
  mutation UpdateNoteItem($filter: String!, $input: NoteItemUpdateInput!) {
    updateNoteItem(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const DELETE_NOTE_MUTATION = `
  mutation DeleteNoteItem($filter: String!, $input: NoteItemDeleteInput!) {
    deleteNoteItem(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;
