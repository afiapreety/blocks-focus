import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Conversation } from '../types/conversation.service.type';
import { conversationService } from '../services/conversation.service';
import { parseSSEBuffer } from '../utils/parse-sse';
import { handleSSEMessage } from '../utils/sse-message-handler';
import { NavigateFunction } from 'react-router-dom';

type MessageType = 'user' | 'bot';

interface ChatMessage {
  message: string;
  type: MessageType;
  streaming: boolean;
  timestamp: string;
}

interface Chat {
  id: string | null;
  sessionId: string | null;
  conversations: ChatMessage[];
  isBotStreaming: boolean;
  isBotThinking: boolean;
  currentEvent: ChatEvent | null;
  lastUpdated: string;
  selectedModel: string;
  selectedTools: string[];
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
  lastUpdated: '',
  selectedModel: 'gpt-4o-mini',
  selectedTools: [],
};

interface ChatStore {
  chats: {
    [id: string]: Chat;
  };
  resolveChatId: (chatId: string) => string;
  activeChatId: string | null;
  initiateChat: (id: string, message: string) => void;
  startChat: (message: string, model: string, tools: string[], navigate: NavigateFunction) => void;
  loadChat: (id: string, conversations: Conversation[]) => void;
  setSessionId: (id: string, sessionId: string) => void;
  addUserMessage: (id: string, message: string) => void;
  initiateBotMessage: (id: string, chunk: string) => void;
  startBotMessage: (id: string, chunk: string) => void;
  streamBotMessage: (id: string, chunk: string) => void;
  setBotErrorMessage: (id: string, chunk: string) => void;
  endBotMessage: (id: string) => void;
  clearChat: (id: string) => void;
  setBotThinking: (id: string, thinking: boolean) => void;
  setCurrentEvent: (id: string, eventType: string | null, message: string) => void;
  setSelectedModel: (id: string, modelId: string) => void;
  setSelectedTools: (id: string, toolIds: string[]) => void;
  deleteChat: (id: string) => void;
  generateBotMessage: (
    id: string,
    message: string,
    setSuggestions?: (suggestions: string[]) => void
  ) => Promise<void>;
  sendMessage: (id: string, message: string) => Promise<void>;
  reset: () => void;
}

// const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';

const getBotSSE = async (
  query: string,
  chat: Chat,
  cb: (
    event: {
      eventType: string;
      eventData: { session_id?: string; query?: string; message?: string };
    },
    done: boolean
  ) => void
) => {
  try {
    const reader = await conversationService.query({
      query: query,
      session_id: (chat.sessionId as string) || undefined,
      base_prompt: 'You are helpful',
      model_id: chat.selectedModel,
      tool_ids: chat.selectedTools,
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
          cb(event, isDone);
        });
      }
    }
  } catch (error) {
    //
  }
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: {},
      activeChatId: null,

      resolveChatId: (chatId) => {
        const state = get();
        if (chatId === 'new') {
          return state.activeChatId || '';
        }
        return chatId;
      },
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

      startChat: (message, model, tools, navigate) => {
        const chatMessage: ChatMessage = {
          message,
          type: 'user',
          streaming: false,
          timestamp: new Date().toISOString(),
        };

        const chatId = crypto.randomUUID();
        const chat = {
          ...chatDefaultValue,
          id: chatId,
          conversations: [chatMessage],
          isBotThinking: true,
          lastUpdated: new Date().toISOString(),
          selectedModel: model,
          selectedTools: tools,
        };
        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: chat,
          },
          activeChatId: chatId,
        }));
        navigate(`/chat/new`);

        getBotSSE(message, chat, (event, done) => {
          if (event.eventData.session_id && !get().chats[event.eventData.session_id]) {
            const newChatId = event.eventData.session_id;
            delete get().chats[chatId];
            set((state) => ({
              chats: {
                ...state.chats,
                [newChatId]: {
                  ...chat,
                  id: newChatId,
                  sessionId: newChatId,
                  isBotThinking: !done,
                },
              },
              activeChatId: newChatId,
            }));
            window.history.replaceState(window.history.state, '', `/chat/${newChatId}`);
          }
          handleSSEMessage(event.eventData.session_id || '', event, undefined);
        });

        return {};
      },
      loadChat: (id, conversations) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
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
              [id]: {
                ...chat,
                sessionId: conversations[0].SessionId,
                conversations: chatConversations,
                lastUpdated: new Date().toISOString(),
                isBotThinking: false,
                isBotStreaming: false,
              },
            },
            activeChatId: conversations[0].SessionId,
          };
        }),

      setSessionId: (id, sessionId) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                sessionId: sessionId,
                isBotStreaming: false,
                isBotThinking: false,
                currentEvent: null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      setCurrentEvent: (id: string, eventType: string | null, message: string) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                currentEvent: eventType ? { type: eventType, message } : null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      addUserMessage: (id, message) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
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

      setBotThinking: (id, thinking) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                isBotThinking: thinking,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      initiateBotMessage: (id, chunk) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
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

      startBotMessage: (id, chunk) =>
        set((state) => {
          const session = state.chats[id] || { ...chatDefaultValue, id };
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
              [id]: {
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

      setBotErrorMessage: (id, chunk) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
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
              [id]: {
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

      streamBotMessage: (id, chunk) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
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
              [id]: {
                ...chat,
                conversations,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      endBotMessage: (id) =>
        set((state) => {
          const session = state.chats[id] || { ...chatDefaultValue, id };
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
              [id]: {
                ...session,
                conversations,
                isBotStreaming: false,
                currentEvent: null,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      clearChat: (id) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                conversations: [],
                isBotStreaming: false,
              },
            },
          };
        }),
      deleteChat: (id) =>
        set((state) => {
          const updatedChats = { ...state.chats };
          delete updatedChats[id];
          return {
            chats: updatedChats,
          };
        }),

      generateBotMessage: async (id, message, setSuggestions) => {
        const state = get();
        const chat = state.chats[id];

        state.setBotThinking(id, true);
        if (setSuggestions) setSuggestions([]);

        try {
          getBotSSE(message, chat, (event) =>
            handleSSEMessage(event.eventData.session_id || '', event, undefined)
          );
        } catch (error) {
          state.setBotThinking(id, false);
          state.setCurrentEvent(id, null, '');
        }
      },

      sendMessage: async (id, message) => {
        const state = get();
        state.addUserMessage(id, message);
        await state.generateBotMessage(id, message);
      },

      setSelectedModel: (id, modelId) => {
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                selectedModel: modelId,
              },
            },
          };
        });
      },
      setSelectedTools: (id, toolIds) => {
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                selectedTools: toolIds,
              },
            },
          };
        });
      },

      reset: () => {
        set({ chats: {} });
      },
    }),
    {
      name: 'selise-blocks-chatbot-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
