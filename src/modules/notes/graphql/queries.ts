/**
 * GraphQL Queries for Notes Management
 *
 * This file contains GraphQL query strings for notes operations.
 * These queries are used with the graphqlClient for data fetching.
 */

export const GET_NOTES_QUERY = `
  query NoteItems($input: DynamicQueryInput) {
    getNoteItems(input: $input) {
      hasNextPage
      hasPreviousPage
      totalCount
      totalPages
      pageSize
      pageNo
      items {
        ItemId
        CreatedBy
        CreatedDate
        IsDeleted
        Language
        LastUpdatedBy
        LastUpdatedDate
        OrganizationIds
        Tags
        DeletedDate
        Title
        Content
        IsPrivate
        WordCount
        CharacterCount
      }
    }
  }
`;

export const GET_NOTE_BY_ID_QUERY = `
  query NoteItem($input: DynamicQueryInput) {
    getNoteItems(input: $input) {
      items {
        ItemId
        CreatedBy
        CreatedDate
        IsDeleted
        Language
        LastUpdatedBy
        LastUpdatedDate
        OrganizationIds
        Tags
        DeletedDate
        Title
        Content
        IsPrivate
        WordCount
        CharacterCount
      }
    }
  }
`;
