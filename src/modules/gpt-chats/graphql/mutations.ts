/**
 * GraphQL Mutations for Inventory Management
 *
 * This file contains GraphQL mutation strings for inventory operations.
 * These mutations are used with the graphqlClient for data modifications.
 */

export const INSERT_SESSION_MUTATION = `
  mutation Insertsession ($input: sessionInsertInput!){
    insertsession(
      input: $input
    ) {
      acknowledged
      totalImpactedData
      itemId
    }
  }
`;

export const UPDATE_SESSION_MUTATION = `
  mutation Updatesession ($filter: String!,$input: sessionUpdateInput!){
    updatesession(
     filter: $filter, input: $input
    ) {
      acknowledged
      totalImpactedData
      itemId
    }
  }
`;

export const DELETE_SESSION_MUTATION = `
  mutation DeleteSession ($filter: String!){
    deletesession(
     filter: $filter
    ) {
      acknowledged
      totalImpactedData
      itemId
    }
  }
`;

export const INSERT_CONVERSATION_MUTATION = `
  mutation InsertConversation($input: conversationInsertInput!) {
    insertconversation(input: $input) {
      acknowledged
      totalImpactedData
      itemId
    }
  }
`;
