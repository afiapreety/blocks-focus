import { conversationService } from '../services/conversation.service';
import {
  IConversationByIdPayload,
  IConversationListPayload,
} from '../types/conversation.service.type';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetConversations = (
  payload: Omit<IConversationListPayload, 'offset' | 'limit'>
) => {
  return useInfiniteQuery({
    queryKey: ['conversations', payload],
    queryFn: ({ pageParam = 0 }) => {
      return conversationService.getConversationList({
        ...payload,
        is_minimal: false,
        limit: 20,
        offset: pageParam * 1,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * 20;
      if (totalFetched < lastPage.total_count) {
        return allPages.length;
      }
      return undefined;
    },
    initialPageParam: 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useGetConversationById = (
  payload: IConversationByIdPayload & { enabled?: boolean }
) => {
  const { enabled = true, ...queryPayload } = payload;
  return useQuery({
    queryKey: ['conversation', queryPayload],
    queryFn: () => conversationService.getConversationSessionById(queryPayload),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled,
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
