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
    refetchOnMount: true,
    staleTime: 0,
    enabled,
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
