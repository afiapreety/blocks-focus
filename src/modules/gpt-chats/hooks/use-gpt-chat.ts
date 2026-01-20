import { useQuery } from '@tanstack/react-query';
import { gptChatService, IGetToolsPayload } from '../services/gpt-chat.service';

export const useGetLlmModels = () => {
  return useQuery({
    queryKey: ['llm-models'],
    queryFn: () => gptChatService.getllmModels(),
  });
};

export const useGetTools = (payload: IGetToolsPayload) => {
  return useQuery({
    queryKey: ['tools', payload],
    queryFn: () => gptChatService.getTools(payload),
  });
};
