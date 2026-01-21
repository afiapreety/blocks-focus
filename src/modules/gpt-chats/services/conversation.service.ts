import { clients } from '@/lib/https';

import {
  IConversationByIdPayload,
  IConversationByIdResponse,
  IConversationConfigPayload,
  IConversationListPayload,
  IConversationListResponse,
  IDeleteConversationByIdPayload,
  Widget,
} from '../types/conversation.service.type';

export type IConversationConfigResponse = Widget;

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

  getConversationList(payload: IConversationListPayload): Promise<IConversationListResponse> {
    return clients.post(`/blocksai-api/v1/conversation/llm-sessions`, JSON.stringify(payload));
  }

  getConversationSessionById(
    payload: IConversationByIdPayload
  ): Promise<IConversationByIdResponse> {
    const url = `/blocksai-api/v1/conversation/llm-sessions/${payload.session_id}`;
    return clients.post(url, JSON.stringify(payload));
  }

  query(body: Record<string, any>) {
    const url = `/blocksai-api/v1/ai-agent/query/stream`;
    return clients.stream(url, JSON.stringify(body));
  }

  deleteConversationSession(payload: IDeleteConversationByIdPayload) {
    const url = `/blocksai-api/v1/conversation/llm-sessions/${payload.session_id}?project_key=${payload.project_key}`;
    return clients.delete(url);
  }
}

export const conversationService = new ConversationService();
