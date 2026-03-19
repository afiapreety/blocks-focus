import { clients } from '@/lib/https';

import {
  IConversationByIdPayload,
  IConversationByIdResponse,
  IConversationConfigPayload,
  IConversationListPayload,
  IConversationListResponse,
  IDeleteConversationByIdPayload,
  IQueryRequestPayload,
  Widget,
} from '../types/conversation.service.type';
import graphqlClient from '@/lib/graphql-client';
import { GET_CONVERSATION_QUERY, GET_SESSIONS_QUERY } from '../graphql/queries';
import {
  DELETE_SESSION_MUTATION,
  INSERT_CONVERSATION_MUTATION,
  INSERT_SESSION_MUTATION,
  UPDATE_SESSION_MUTATION,
} from '../graphql/mutations';

export type IConversationConfigResponse = Widget;

export interface IConversationInitiatePayload {
  widget_id: string;
  project_key: string;
  session_id?: string;
}

export interface IConversationInitiateResponse {
  session_id: string;
  token: string;
  websocket_url: string;
  expires_at: string;
  is_success: boolean;
  detail: string;
}

export class ConversationService {
  config(payload: IConversationConfigPayload): Promise<IConversationConfigResponse> {
    return fetch('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        widget_id: payload.widget_id,
        project_key: payload.project_key,
        application_domain: payload.application_domain ?? '',
      }),
    }).then((res) => res.json());
  }

  initiate(payload: IConversationInitiatePayload): Promise<IConversationInitiateResponse> {
    let url = `blocksai-api/v1/conversation/initiate?widget_id=${payload.widget_id}`;
    if (payload.session_id) {
      url += `&session_id=${payload.session_id}`;
    }
    return clients.get(url);
  }

  getConversationList(payload: IConversationListPayload): Promise<IConversationListResponse> {
    return clients.post(`/blocksai-api/v1/conversation/llm-sessions`, JSON.stringify(payload));
  }

  getConversationSessionById(
    payload: IConversationByIdPayload
  ): Promise<IConversationByIdResponse> {
    const url = `/blocksai-api/v1/conversation/llm-sessions/${payload.session_id}`;
    return clients.post(url, JSON.stringify(payload));
  }

  query(body: IQueryRequestPayload) {
    const url = `/blocksai-api/v1/ai-agent/query/stream`;
    return clients.stream(url, JSON.stringify(body));
  }

  agentSSEQuery = (payload: {
    sessionId: string;
    token: string;
    projectKey: string;
    message: string;
  }) => {
    const url = `/blocksai-api/v1/chat/${payload.sessionId}?x_blocks_token=${payload.token}&x_blocks_key=${payload.projectKey}&se=true`;
    return clients.stream(url, JSON.stringify({ message: payload.message }), {
      'Content-Type': 'application/json',
      'x-blocks-token': payload.token,
      'x-blocks-key': payload.projectKey,
    });
  };

  deleteConversationSession(payload: IDeleteConversationByIdPayload) {
    const url = `/blocksai-api/v1/conversation/llm-sessions/${payload.session_id}?project_key=${payload.project_key}`;
    return clients.delete(url);
  }

  //temporary method to fetch widget details

  getSessions({ userId }: { userId?: string } = {}): Promise<{
    getsessions: {
      totalCount: number;
      items: {
        ItemId: string;
        LastUpdatedDate: string;
        title: string;
        sessionId: string;
      }[];
    };
  }> {
    return graphqlClient.query({
      query: GET_SESSIONS_QUERY,
      variables: {
        filter: JSON.stringify({ userId }),
      },
    });
  }

  getLLMConversationSessionById({
    chatId,
  }: {
    chatId: string;
  }): Promise<IConversationByIdResponse> {
    return graphqlClient.query({
      query: GET_CONVERSATION_QUERY,
      variables: { filter: JSON.stringify({ chatId }) },
    });
  }

  insertSession({ userId, title }: { userId: string; title: string }): Promise<any> {
    return graphqlClient.mutate({
      query: INSERT_SESSION_MUTATION,
      variables: {
        input: {
          userId: userId,
          title: title,
        },
      },
    });
  }

  updateSession({
    filter,
    payload,
  }: {
    filter: { ItemId: string };
    payload: { userId?: string; title?: string; sessionId?: string };
  }): Promise<any> {
    return graphqlClient.mutate({
      query: UPDATE_SESSION_MUTATION,
      variables: {
        filter: JSON.stringify({
          _id: filter.ItemId,
        }),
        input: payload,
      },
    });
  }

  deleteSession({ filter }: { filter: { ItemId: string } }): Promise<any> {
    return graphqlClient.mutate({
      query: DELETE_SESSION_MUTATION,
      variables: {
        filter: JSON.stringify({
          _id: filter.ItemId,
        }),
      },
    });
  }

  insertConversation(payload: {
    query: string;
    // queryTimestamp: string;
    response: string;
    // responseTimestamp: string;
    chatId: string;
    sessionId: string;
  }): Promise<any> {
    return graphqlClient.mutate({
      query: INSERT_CONVERSATION_MUTATION,
      variables: {
        input: payload,
      },
    });
  }
}

export const conversationService = new ConversationService();
