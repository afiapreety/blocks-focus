import { clients } from '@/lib/https';

export type IGetAgentModelResponse = {
  provider: string;
  model_name: string;
  model_name_label: string;
  provider_label: string;
  model_type: 'chat' | 'embedding';
}[];

export class GptChatService {
  getllmModels(): Promise<IGetAgentModelResponse> {
    return clients.get(`/blocksai-api/v1/agents/models`);
  }

  getCustomllmModels(): Promise<IGetAgentModelResponse> {
    return clients.get(`/blocksai-api/v1/models/`);
  }
}

export const gptChatService = new GptChatService();
