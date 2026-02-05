import { useCallback, useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { SelectModelType, useChatStore } from './use-chat-store';
import { useGetConversationById } from './use-conversation-api';
import { useGetAgentConversationSessionById } from './use-agent-conversation';
import { Conversation } from '../types/conversation.service.type';

interface UseChatSSE {
  chatId?: string;
  agentId?: string | null;
  widgetId?: string | null;
}

const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';

export const useChatSSE = ({ chatId = '', agentId = null, widgetId = null }: UseChatSSE) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const {
    chats,
    loadChat,
    loadAgentChat,
    generateBotMessage: generateFromStore,
    sendMessage: sendFromStore,
    setSelectedModel,
    setSelectedTools,
  } = useChatStore();
  const activeChatId = useChatStore((state) => state.resolveChatId(chatId || ''));
  const chat = chats[activeChatId] || {
    sessionId: '',
    conversations: [],
    isBotStreaming: false,
    isBotThinking: false,
    pendingSend: false,
  };
  const sessionId = chat.sessionId || '';
  const conversations = chat.conversations || [];
  const isBotStreaming = chat.isBotStreaming || false;
  const isBotThinking = chat.isBotThinking || false;
  const currentEvent = chat?.currentEvent || null;

  // Determine if it's an agent chat from the store's selectedModel
  const isAgentChat = chat?.selectedModel?.provider === 'agents' || !!agentId;

  const { data: modelChatData, isFetching: isFetchingModelChat } = useGetConversationById({
    allow_created_by_filter: true,
    call_from: projectSlug,
    project_key: projectKey,
    session_id: activeChatId,
    limit: 100,
    offset: 0,
    enabled: !isAgentChat && activeChatId !== 'new',
  });

  const { data: agentChatData, isFetching: isFetchingAgentChat } =
    useGetAgentConversationSessionById({
      project_key: projectKey,
      session_id: activeChatId,
      agent_id: agentId || '',
      limit: 100,
      offset: 0,
      enabled: isAgentChat && activeChatId !== 'new',
    });

  const data = isAgentChat ? agentChatData : modelChatData;
  const isFetching = isAgentChat ? isFetchingAgentChat : isFetchingModelChat;

  useEffect(() => {
    if (activeChatId && activeChatId != 'new' && data) {
      if (data.total_count > 0) {
        const conversationData = data.sessions;
        if (isAgentChat && agentId) {
          loadAgentChat(
            activeChatId,
            conversationData as Conversation[],
            agentId,
            widgetId || undefined
          );
        } else {
          loadChat(activeChatId, conversationData as Conversation[]);
        }
      }
    }
  }, [activeChatId, data, isAgentChat, agentId, widgetId, loadChat, loadAgentChat]);

  const generateBotMessage = useCallback(
    async (data: { message: string }) => {
      await generateFromStore(activeChatId, data.message, setSuggestions);
    },
    [activeChatId, generateFromStore]
  );

  const sendMessage = useCallback(
    async (data: { message: string }) => {
      await sendFromStore(activeChatId, data.message);
    },
    [activeChatId, sendFromStore]
  );

  const onModelChange = useCallback(
    (model: SelectModelType) => setSelectedModel(activeChatId, model),
    [activeChatId, setSelectedModel]
  );

  const onToolsChange = useCallback(
    (tools: string[]) => {
      setSelectedTools(activeChatId, tools);
    },
    [activeChatId, setSelectedTools]
  );

  const isOnline = onlineManager.isOnline;
  const isReady = chatId == 'new' ? true : !isFetching;
  const { selectedModel, selectedTools } = chat;
  return {
    sessionId,
    sendMessage,
    conversations,
    isBotThinking,
    isBotStreaming,
    suggestions,
    selectedModel,
    selectedTools,

    onModelChange,
    onToolsChange,
    generateBotMessage,
    currentEvent,
    isOnline,
    isReady,
  };
};
