import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type MessageType = 'user' | 'bot';

interface ChatMessage {
  message: string;
  type: MessageType;
  streaming: boolean;
  timestamp: string;
}

interface ChatEvent {
  type: string;
  message: string;
}

const chatDefaultValue = {
  id: null,
  conversations: [],
  sessionId: null,
  isBotStreaming: false,
  isBotThinking: false,
  currentEvent: null as ChatEvent | null,
  pendingSend: false,
  lastUpdated: '',
};

interface ChatStore {
  chats: {
    [id: string]: {
      id: string | null;
      sessionId: string | null;
      conversations: ChatMessage[];
      isBotStreaming: boolean;
      isBotThinking: boolean;
      currentEvent: ChatEvent | null;
      pendingSend: boolean;
      lastUpdated: string;
    };
  };
  initiateChat: (chatId: string, message: string) => void;
  setSessionId: (chatId: string, id: string) => void;
  addUserMessage: (chatId: string, message: string) => void;
  initiateBotMessage: (chatId: string, chunk: string) => void;
  startBotMessage: (chatId: string, chunk: string) => void;
  streamBotMessage: (chatId: string, chunk: string) => void;
  setBotErrorMessage: (chatId: string, chunk: string) => void;
  endBotMessage: (chatId: string) => void;
  clearChat: (chatId: string) => void;
  setBotThinking: (chatId: string, thinking: boolean) => void;
  setCurrentEvent: (chatId: string, eventType: string | null, message: string) => void;
  deleteChat: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      chats: {},

      initiateChat: (chatId, message) =>
        set((state) => {
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chatDefaultValue,
                id: chatId,
                conversations: [
                  {
                    message,
                    type: 'user',
                    streaming: false,
                    timestamp: new Date().toISOString(),
                  },
                ],
                isBotThinking: true,
                pendingSend: true,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      setSessionId: (chatId, id) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                sessionId: id,
                isBotStreaming: false,
                isBotThinking: false,
                currentEvent: null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      setCurrentEvent: (chatId: string, eventType: string | null, message: string) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                currentEvent: eventType ? { type: eventType, message } : null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      addUserMessage: (chatId, message) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                conversations: [
                  ...chat.conversations,
                  {
                    message,
                    type: 'user',
                    streaming: false,
                    timestamp: new Date().toISOString(),
                  },
                ],
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      setBotThinking: (chatId, thinking) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                isBotThinking: thinking,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      initiateBotMessage: (chatId, chunk) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                pendingSend: false,
                isBotThinking: true,
                conversations: [
                  ...chat.conversations,
                  {
                    message: chunk,
                    streaming: true,
                    type: 'bot',
                    timestamp: new Date().toISOString(),
                  },
                ],
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      startBotMessage: (chatId, chunk) =>
        set((state) => {
          const session = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          if (!session || session.conversations.length === 0) return state;

          const conversations = [...session.conversations];
          const lastIndex = conversations.length - 1;
          const last = conversations[lastIndex];

          if (last.type === 'bot' && last.streaming) {
            conversations[lastIndex] = {
              ...last,
              message: chunk,
              timestamp: new Date().toISOString(),
            };
          }

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...session,
                conversations,
                isBotThinking: false,
                pendingSend: false,
                isBotStreaming: true,
                currentEvent: null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      setBotErrorMessage: (chatId, chunk) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          if (!chat || chat.conversations.length === 0) return state;

          const conversations = [...chat.conversations];
          const lastIndex = conversations.length - 1;
          const last = conversations[lastIndex];

          if (last.type === 'bot' && last.streaming) {
            conversations[lastIndex] = {
              ...last,
              message: chunk,
            };
          }

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                conversations,
                isBotThinking: false,
                isBotStreaming: true,
                currentEvent: null,
                pendingSend: false,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      streamBotMessage: (chatId, chunk) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          if (!chat || chat.conversations.length === 0) return state;

          const conversations = [...chat.conversations];
          const lastIndex = conversations.length - 1;
          const last = conversations[lastIndex];

          if (last.type === 'bot' && last.streaming) {
            conversations[lastIndex] = {
              ...last,
              message: last.message + chunk,
            };
          }

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                conversations,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      endBotMessage: (chatId) =>
        set((state) => {
          const session = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          if (!session || session.conversations.length === 0) return state;

          const conversations = [...session.conversations];
          const lastIndex = conversations.length - 1;
          const last = conversations[lastIndex];

          if (last.type === 'bot' && last.streaming) {
            conversations[lastIndex] = {
              ...last,
              streaming: false,
            };
          }

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...session,
                conversations,
                isBotStreaming: false,
                currentEvent: null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      clearChat: (chatId) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: {
              id: chatId,
              sessionId: null,
              conversations: [],
              isBotStreaming: false,
              isBotThinking: false,
              currentEvent: null,
              pendingSend: false,
              lastUpdated: new Date().toISOString(),
            },
          },
        })),
      deleteChat: (chatId) =>
        set((state) => {
          const updatedChats = { ...state.chats };
          delete updatedChats[chatId];
          return {
            chats: updatedChats,
          };
        }),
    }),
    {
      name: 'selise-blocks-chatbot-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
