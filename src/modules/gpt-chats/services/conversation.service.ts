import { clients } from '@/lib/https';

import {
  IConversationByIdPayload,
  IConversationByIdResponse,
  IConversationConfigPayload,
  IConversationInitiatePayload,
  IConversationInitiateResponse,
  IConversationListPayload,
  IConversationListResponse,
  Widget,
} from '../types/conversation.service.type';

export type IConversationConfigResponse = Widget;

export class ConversationService {
  baseUrl: string;
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

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
    const url = `/api/initiate`;
    return fetch(url, {
      method: 'post',
      body: JSON.stringify({
        widget_id: payload.widget_id,
        project_key: payload.project_key,
        session_id: payload.session_id,
      }),
    }).then((res) => res.json());
  }

  getConversationList(payload: IConversationListPayload): Promise<IConversationListResponse> {
    return clients.post(`/blocksai-api/v1/conversation/sessions`, JSON.stringify(payload));
  }

  getConversationSessionById(
    payload: IConversationByIdPayload
  ): Promise<IConversationByIdResponse> {
    const url = `/blocksai-api/v1/conversation/sessions/${payload.session_id}`;
    return clients.post(url, JSON.stringify(payload));
  }
}

export const conversationService = new ConversationService();
