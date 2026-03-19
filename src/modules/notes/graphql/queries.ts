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
        CreatedDate
        CreatedBy
        LastUpdatedDate
        LastUpdatedBy
        IsDeleted
        Language
        OrganizationIds
        Tags
        DeletedDate
        IsPrivate
        WordCount
        CharacterCount
        AccessControl
        UserId
        NoteData {
          Files
          NoteContent {
            md
            html
          }
        }
        NoteUser {
          UserId
          Name
          Roles
          Email
        }
      }
    }
  }
`;

export const GET_NOTE_BY_ID_QUERY = `
  query NoteItem($input: DynamicQueryInput) {
    getNoteItems(input: $input) {
      items {
        ItemId
        CreatedDate
        CreatedBy
        LastUpdatedDate
        LastUpdatedBy
        IsDeleted
        Language
        OrganizationIds
        Tags
        DeletedDate
        IsPrivate
        WordCount
        CharacterCount
        AccessControl
        UserId
        NoteData {
          Files
          NoteContent {
            md
            html
          }
        }
        NoteUser {
          UserId
          Name
          Roles
          Email
        }
      }
    }
  }
`;
