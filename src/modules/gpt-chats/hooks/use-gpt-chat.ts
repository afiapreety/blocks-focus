import { useQuery } from '@tanstack/react-query';
import {
  gptChatService,
  IGetAgentsModelPayload,
  IGetToolsPayload,
} from '../services/gpt-chat.service';

export const useGetAgents = (payload: IGetAgentsModelPayload) => {
  return useQuery({
    queryKey: ['agents', payload],
    queryFn: () => gptChatService.getAgents(payload),
  });
};

export const useGetLlmModels = () => {
  return useQuery({
    queryKey: ['llm-models'],
    queryFn: () => gptChatService.getllmModels(),
  });
};

export const useGetCustomLlmModels = () => {
  return useQuery({
    queryKey: ['custom-llm-models'],
    queryFn: () => gptChatService.getCustomllmModels(),
  });
};

export const useGetTools = (payload: IGetToolsPayload) => {
  return useQuery({
    queryKey: ['tools', payload],
    queryFn: () => gptChatService.getTools(payload),
  });
};
