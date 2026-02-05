import { clients } from '@/lib/https';
import {
  IGetAgentByIdPayload,
  IGetAgentByIdResponse,
  IGetAgentsPayload,
  IGetAgentsResponse,
} from '../types/agent.service.type';

export class AgentService {
  getAgents(payload: IGetAgentsPayload): Promise<IGetAgentsResponse> {
    return clients.post(`/blocksai-api/v1/agents/queries`, JSON.stringify(payload));
  }

  getAgentById(payload: IGetAgentByIdPayload): Promise<IGetAgentByIdResponse> {
    return clients.get(
      `/blocksai-api/v1/agents/query/${payload.id}?project_key=${payload.projectKey}`
    );
  }

  agentChatStream(widgetId: string, body: Record<string, any>, sessionId?: string) {
    const queryParams = sessionId ? `?s_id=${sessionId}` : '';
    const url = `/blocksai-api/v1/ai-agent/chat/${widgetId}${queryParams}`;
    return clients.stream(url, JSON.stringify(body));
  }
}

export const agentService = new AgentService();
