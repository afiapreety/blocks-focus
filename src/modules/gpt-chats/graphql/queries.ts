/**
 * GraphQL Queries for Inventory Management
 *
 * This file contains GraphQL query strings for inventory operations.
 * These queries are used with the graphqlClient for data fetching.
 */

export const GET_SESSIONS_QUERY = `
  query GetSessions($filter: String!) {
    getsessions(
      input: {
        filter: $filter
        sort: "{}"
        pageNo: 1
        pageSize: 100
      }
    ) {
      totalCount
      totalPages
      hasNextPage
      hasPreviousPage
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
        userId
        title
        sessionId
      }
    }
  }
`;

export const GET_CONVERSATION_QUERY = `
  query GetConversation($filter: String!) {
    getconversations(
      input: {
        filter: $filter
        sort: "{}"
        pageNo: 1
        pageSize: 100
      }
    ) {
      totalCount
      totalPages
      hasNextPage
      hasPreviousPage
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
        query
        response
        chatId
        sessionId
      }
    }
  }
`;
