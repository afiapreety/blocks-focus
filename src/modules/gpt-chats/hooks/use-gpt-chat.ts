import { useQuery } from '@tanstack/react-query';
import { gptChatService } from '../services/gpt-chat.service';

export const useGetLlmModels = () => {
  return useQuery({
    queryKey: ['llm-models'],
    queryFn: () => gptChatService.getllmModels(),
  });
};
