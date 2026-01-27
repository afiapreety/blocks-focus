import { conversationService } from '../services/conversation.service';
import {
  IConversationByIdPayload,
  IConversationListPayload,
} from '../types/conversation.service.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetConversations = (payload: IConversationListPayload) => {
  return useQuery({
    queryKey: ['conversations', payload],
    queryFn: () => conversationService.getConversationList(payload),
    refetchInterval: 5000,
  });
};

export const useGetConversationById = (payload: IConversationByIdPayload) => {
  return useQuery({
    queryKey: ['conversation', payload],
    queryFn: () => conversationService.getConversationSessionById(payload),
    refetchOnMount: true,
    staleTime: 0,
  });
};

export const useGetLLMConversationById = (payload: { chatId: string }) => {
  return useQuery({
    queryKey: ['llm-conversation', payload],
    queryFn: () => conversationService.getLLMConversationSessionById(payload),
    refetchOnMount: true,
    staleTime: 0,
  });
};

export const useDeleteConversationById = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['delete-conversation'],
    mutationFn: conversationService.deleteConversationSession,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useGetSessions = (payload: { userId?: string }) => {
  return useQuery({
    queryKey: ['sessions', payload],
    queryFn: () => conversationService.getSessions(payload),
    refetchInterval: 5000,
  });
};

export const useDeleteLLMConversationById = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['delete-conversation'],
    mutationFn: conversationService.deleteSession,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
