import { conversationService } from '../services/conversation.service';
import {
  IConversationByIdPayload,
  IConversationListPayload,
} from '../types/conversation.service.type';
import { useQuery } from '@tanstack/react-query';

export const useGetConversations = (payload: IConversationListPayload) => {
  return useQuery({
    queryKey: ['conversations', payload],
    queryFn: () => conversationService.getConversationList(payload),
  });
};

export const useGetConversationById = (payload: IConversationByIdPayload) => {
  return useQuery({
    queryKey: ['conversation', payload],
    queryFn: () => conversationService.getConversationSessionById(payload),
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
