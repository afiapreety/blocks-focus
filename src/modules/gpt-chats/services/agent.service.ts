import { clients } from '@/lib/https';
import {
  IGetAgentByIdPayload,
  IGetAgentByIdResponse,
  IGetAgentsPayload,
  IGetAgentsResponse,
  IProcessFilesPayload,
  IAgentChatStreamPayload,
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

  agentChatStream(widgetId: string, body: IAgentChatStreamPayload, sessionId?: string) {
    const queryParams = sessionId ? `?s_id=${sessionId}` : '';
    const url = `/blocksai-api/v1/ai-agent/chat/${widgetId}${queryParams}`;
    return clients.stream(url, JSON.stringify(body));
  }

  processFiles(payload: IProcessFilesPayload) {
    return clients.stream(`/blocksai-api/v1/ai-agent/file/process`, JSON.stringify(payload));
  }
}

export const agentService = new AgentService();
