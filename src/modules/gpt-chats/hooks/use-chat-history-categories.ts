import { useMemo } from 'react';
import {
  categorizeChatsByDate,
  CategorizedChatHistories,
  ChatHistory,
} from '../utils/chat-category';

export const useCategorizedChatHistories = (chatList: ChatHistory[]): CategorizedChatHistories => {
  return useMemo(() => categorizeChatsByDate(chatList), [chatList]);
};
