import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  IAgentConversationByIdPayload,
  IAgentConversationListPayload,
} from '../types/agent-conversation.type';
import { agentConversationService } from '../services/agent-conversation.service';

export const useGetAgentConversationList = (
  payload: Omit<IAgentConversationListPayload, 'offset' | 'limit'>
) => {
  return useInfiniteQuery({
    queryKey: ['agent-conversation-list', payload],
    queryFn: ({ pageParam = 0 }) => {
      return agentConversationService.getAgentConversationList({
        ...payload,
        // is_minimal: false,
        allow_created_by_filter: true,
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

export const useGetAgentConversationSessionById = (
  payload: IAgentConversationByIdPayload & { enabled?: boolean }
) => {
  const { enabled = true, ...queryPayload } = payload;
  return useQuery({
    queryKey: ['agent-conversation', queryPayload],
    queryFn: () => agentConversationService.getAgentConversationSessionById(queryPayload),
    enabled: enabled && !!queryPayload.session_id && !!queryPayload.agent_id,
  });
};
