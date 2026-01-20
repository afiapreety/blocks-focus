import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Conversation } from '../types/conversation.service.type';
import { conversationService } from '../services/conversation.service';
import { parseSSEBuffer } from '../utils/parse-sse';
import { handleSSEMessage } from '../utils/sse-message-handler';

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
  // startChat: (message: string, navigateUrl: string) => void;
  loadChat: (chatId: string, conversations: Conversation[]) => void;
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
  generateBotMessage: (
    chatId: string,
    message: string,
    setSuggestions?: (suggestions: string[]) => void
  ) => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  reset: () => void;
}

// const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
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

      // startChat: (message, navigateUrl) => {
      //   return {};
      // },
      loadChat: (chatId, conversations) =>
        set((state) => {
          const chat = state.chats[chatId] || { ...chatDefaultValue, id: chatId };
          const chatConversations: ChatMessage[] = conversations.flatMap((conversation) => {
            return [
              {
                message: conversation.Query,
                type: 'user',
                streaming: false,
                timestamp: conversation.QueryTimestamp,
              },
              {
                message: conversation.Response,
                type: 'bot',
                streaming: false,
                timestamp: conversation.ResponseTimestamp,
              },
            ];
          });
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                sessionId: conversations[0].SessionId,
                conversations: chatConversations,
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

      generateBotMessage: async (chatId, message, setSuggestions) => {
        const state = get();
        const sessionId = state.chats[chatId]?.sessionId || '';

        state.setBotThinking(chatId, true);
        if (setSuggestions) setSuggestions([]);

        try {
          const reader = await conversationService.query({
            query: message,
            session_id: sessionId || undefined,
            base_prompt: 'You are helpful',
            model_id: 'gpt-4',
            tool_ids: [],
            last_n_turn: 5,
            enable_summary: false,
            enable_next_suggestion: false,
            response_type: 'text',
            response_format: 'string',
            call_from: projectSlug,
          });

          const decoder = new TextDecoder();
          let buffer = '';
          let isDone = false;

          while (!isDone) {
            const { done, value } = await reader.read();
            isDone = done;

            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const { events, remaining } = parseSSEBuffer(buffer);
              buffer = remaining;

              events.forEach((event) => {
                handleSSEMessage(chatId, event, setSuggestions);
              });
            }
          }
        } catch (error) {
          state.setBotThinking(chatId, false);
          state.setCurrentEvent(chatId, null, '');
        }
      },

      sendMessage: async (chatId, message) => {
        const state = get();
        state.addUserMessage(chatId, message);
        await state.generateBotMessage(chatId, message);
      },

      reset: () => {
        console.log;
        set({ chats: {} });
      },
    }),
    {
      name: 'selise-blocks-chatbot-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
