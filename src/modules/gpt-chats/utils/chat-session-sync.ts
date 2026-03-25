import type { QueryClient } from '@tanstack/react-query';
import { SelectModelType } from '../types/chat-store.types';

export const syncChatToSidebar = (
  queryClient: QueryClient,
  sessionId: string | null,
  message: string,
  selectedModel: SelectModelType
) => {
  if (!sessionId) return;
  const isAgentChat = selectedModel?.provider === 'agents';
  const queryKey = isAgentChat ? ['agent-conversation-list'] : ['conversations'];

  queryClient.setQueryData(queryKey, (oldData: any) => {
    if (!oldData?.pages) return oldData;

    const newSession = {
      session_id: sessionId,
      last_entry_date: new Date().toISOString(),
      conversation: {
        Title: message.slice(0, 35),
        Query: message,
      },
    };

    const updatedPages = [...oldData.pages];
    if (updatedPages[0]) {
      updatedPages[0] = {
        ...updatedPages[0],
        sessions: [newSession, ...updatedPages[0].sessions],
      };
    }

    return { ...oldData, pages: updatedPages };
  });

  setTimeout(() => {
    if (isAgentChat) {
      queryClient.invalidateQueries({ queryKey: ['agent-conversation-list'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, 2000);
};

export const updateUrlWithSessionId = (
  sessionId: string | null,
  selectedModel: SelectModelType
) => {
  if (!sessionId) return;
  const isAgentChat = selectedModel?.provider === 'agents';
  const newUrl = isAgentChat
    ? `/chat/${sessionId}?agent=${selectedModel.model}&widget=${selectedModel.widget_id}`
    : `/chat/${sessionId}`;
  window.history.replaceState(null, '', newUrl);
};
