import { useCallback, useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { useChatStore } from './use-chat-store';
import { useGetConversationById } from './use-conversation-api';

interface UseChatSSE {
  chatId?: string;
}

const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';

export const useChatSSE = ({ chatId = '' }: UseChatSSE) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const {
    chats,
    loadChat,
    generateBotMessage: generateFromStore,
    sendMessage: sendFromStore,
  } = useChatStore();
  const sessionId = chats[chatId]?.sessionId || '';
  const conversations = chats[chatId]?.conversations || [];
  const isBotStreaming = chats[chatId]?.isBotStreaming || false;
  const isBotThinking = chats[chatId]?.isBotThinking || false;
  const isPendingSend = chats[chatId]?.pendingSend || false;

  const { data, isFetched } = useGetConversationById({
    allow_created_by_filter: true,
    call_from: projectSlug,
    project_key: projectKey,
    session_id: chatId,
    limit: 100,
    offset: 0,
  });

  useEffect(() => {
    if (chatId && isFetched && data) {
      if (data.total_count > 0) {
        const conversationData = data.sessions;
        loadChat(chatId, conversationData);
      }
    }
  }, [chatId, data, isFetched, loadChat]);

  const generateBotMessage = useCallback(
    async (data: { message: string }) => {
      await generateFromStore(chatId, data.message, setSuggestions);
    },
    [chatId, generateFromStore]
  );

  const sendMessage = useCallback(
    async (data: { message: string }) => {
      await sendFromStore(chatId, data.message);
    },
    [chatId, sendFromStore]
  );

  const isOnline = onlineManager.isOnline;

  return {
    sessionId,
    sendMessage,
    conversations,
    isBotThinking,
    isBotStreaming,
    suggestions,
    isOnline,
    generateBotMessage,
    isPendingSend,
  };
};
