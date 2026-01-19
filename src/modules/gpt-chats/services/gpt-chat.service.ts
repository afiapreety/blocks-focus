import { clients } from '@/lib/https';

export type IGetAgentModelResponse = {
  provider: string;
  model_name: string;
  model_name_label: string;
  provider_label: string;
  model_type: 'chat' | 'embedding';
}[];

export type ToolType = 'api' | 'mcp_server' | 'webhook' | 'graphql';
export type ToolStatus = 'active' | 'inactive' | 'deprecated' | 'maintenance';

export interface IGetToolsPayload {
  tool_type?: ToolType | null;
  tool_status?: ToolStatus | null;
  page?: number;
  page_size?: number;
  project_key?: string;
}

export interface ITool {
  id: string;
  name: string;
  type: ToolType;
  status: ToolStatus;
  description: string;
  total_uses: number;
  total_actions: number;
}

export interface IGetToolsResponse {
  tools: ITool[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class GptChatService {
  getllmModels(): Promise<IGetAgentModelResponse> {
    return clients.get(`/blocksai-api/v1/agents/models`);
  }

  getCustomllmModels(): Promise<IGetAgentModelResponse> {
    return clients.get(`/blocksai-api/v1/models/`);
  }

  getTools(payload: IGetToolsPayload): Promise<IGetToolsResponse> {
    const { tool_type, tool_status, page = 1, page_size = 50, project_key } = payload;

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    });

    if (tool_type) {
      params.append('tool_type', tool_type);
    }

    if (tool_status) {
      params.append('tool_status', tool_status);
    }

    if (project_key) {
      params.append('project_key', project_key);
    }

    return clients.get(`/blocksai-api/v1/tools/?${params.toString()}`);
  }
}

export const gptChatService = new GptChatService();
