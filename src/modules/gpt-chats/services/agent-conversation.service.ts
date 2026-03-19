import { clients } from '@/lib/https';
import {
  IAgentConversationByIdPayload,
  IAgentConversationByIdResponse,
  IAgentConversationListPayload,
  IAgentConversationListResponse,
} from '../types/agent-conversation.type';

export class AgentConversationService {
  getAgentConversationList(
    payload: IAgentConversationListPayload
  ): Promise<IAgentConversationListResponse> {
    return clients.post(`/blocksai-api/v1/conversation/sessions`, JSON.stringify(payload));
  }

  getAgentConversationSessionById(
    payload: IAgentConversationByIdPayload
  ): Promise<IAgentConversationByIdResponse> {
    const url = `/blocksai-api/v1/conversation/sessions/${payload.session_id}`;
    return clients.post(url, JSON.stringify(payload));
  }
}

export const agentConversationService = new AgentConversationService();
