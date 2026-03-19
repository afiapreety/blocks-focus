import { clients } from '@/lib/https';

export type Agent = {
  id: string;
  created_date: string;
  last_updated_date: string;
  created_by: string;
  language: string;
  last_updated_by: string;
  organization_ids: string[];
  tags: string[];
  name: string;
  agent_type: string | null;
  role: string;
  description: string;
  domain_expertise: string[];
  enable_rag: boolean;
  logo_url: string | null;
  logo_id: string | null;
  is_disabled: boolean;
  is_archived: boolean;
  enable_tools: boolean;
  tool_ids: string[];
  enable_knowledge_base: boolean;
  enable_memory: boolean;
  enable_human_handoff: boolean;
  published_date?: string;
  response_type: string;
  response_format: string | null;
  widget_id: string;
};

export type AgentSummary = Pick<
  Agent,
  | 'id'
  | 'name'
  | 'tags'
  | 'role'
  | 'description'
  | 'logo_url'
  | 'logo_id'
  | 'is_archived'
  | 'is_disabled'
  | 'widget_id'
>;

export type IGetAgentsModelPayload = {
  limit: number;
  offset: number;
  project_key: string;
};

export interface IGetAgentsResponse {
  agents: AgentSummary[];
  total_count: number;
}

export type IGetAgentModelResponse = {
  provider: string;
  model_name: string;
  model_name_label: string;
  provider_label: string;
  model_type: 'chat' | 'embedding';
}[];

export type IGetCustomLlmModelsResponse = {
  models: {
    _id: string;
    CreatedDate: string;
    LastUpdatedDate: string;
    CreatedBy: string;
    Language: string | null;
    LastUpdatedBy: string;
    OrganizationIds: string[];
    Tags: string[];
    Provider: string;
    ModelType: 'chat' | 'embedding';
    ServicePlatform: string;
    ProjectKey: string | null;
    Description: string | null;
    Capabilities: {
      max_tokens: number | null;
      context_length: number | null;
      default_temp: number | null;
    };
    DisplayName: string;
    ModelName: string;
    ApiKey: string;
    BaseUrl: string;
    OpenAiOrganizationId: string;
    OpenAiProjectId: string;
    ApiVersion: string | null;
    DeploymentName: string | null;
    CustomParameters: Record<string, unknown> | null;
    CustomHeaders: Record<string, unknown> | null;
    Status: string;
    IsActive: boolean;
    HasStreaming: boolean;
  }[];
};

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
  getAgents(payload: IGetAgentsModelPayload): Promise<IGetAgentsResponse> {
    return clients.post(`/blocksai-api/v1/agents/queries`, JSON.stringify(payload));
  }
  getllmModels(): Promise<IGetAgentModelResponse> {
    return clients.get(`/blocksai-api/v1/agents/models`);
  }

  getCustomllmModels(): Promise<IGetCustomLlmModelsResponse> {
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
