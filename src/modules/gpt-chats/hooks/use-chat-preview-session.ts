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

const sessionDefaultValue = {
  conversations: [],
  sessionId: null,
  isBotStreaming: false,
  isBotThinking: false,
  currentEvent: null as ChatEvent | null,
};
interface ChatSessionState {
  sessions: {
    [widgetId: string]: {
      sessionId: string | null;
      conversations: ChatMessage[];
      isBotStreaming: boolean;
      isBotThinking: boolean;
      currentEvent: ChatEvent | null;
    };
  };
  setSessionId: (widgetId: string, id: string) => void;
  addUserMessage: (widgetId: string, message: string) => void;
  initiateBotMessage: (widgetId: string, chunk: string) => void;
  startBotMessage: (widgetId: string, chunk: string) => void;
  streamBotMessage: (widgetId: string, chunk: string) => void;
  setBotErrorMessage: (widgetId: string, chunk: string) => void;
  endBotMessage: (widgetId: string) => void;
  clearSession: (widgetId: string) => void;
  setBotThinking: (widgetId: string, thinking: boolean) => void;
  setCurrentEvent: (widgetId: string, eventType: string | null, message: string) => void;
}

export const useChatPreviewSession = create<ChatSessionState>()(
  persist(
    (set) => ({
      sessions: {},

      setSessionId: (widgetId, id) =>
        set((state) => {
          const session = state.sessions[widgetId] || sessionDefaultValue;
          session.sessionId = id;
          session.isBotStreaming = false;
          session.isBotThinking = false;
          session.currentEvent = null;
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      setCurrentEvent: (widgetId: string, eventType: string | null, message: string) =>
        set((state) => {
          const session = state.sessions[widgetId] || sessionDefaultValue;
          session.currentEvent = eventType ? { type: eventType, message } : null;
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      addUserMessage: (widgetId, message) =>
        set((state) => {
          const session = state.sessions[widgetId] || sessionDefaultValue;
          const { conversations } = session;
          conversations.push({
            message,
            type: 'user',
            streaming: false,
            timestamp: new Date().toISOString(),
          });
          session.conversations = [...conversations];
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      setBotThinking: (widgetId, thinking) =>
        set((state) => {
          const session = state.sessions[widgetId] || sessionDefaultValue;
          session.isBotThinking = thinking;
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      initiateBotMessage: (widgetId, chunk) =>
        set((state) => {
          const session = state.sessions[widgetId] || sessionDefaultValue;
          session.isBotThinking = true;
          const { conversations } = session;
          conversations.push({
            message: chunk,
            streaming: true,
            type: 'bot',
            timestamp: new Date().toISOString(),
          });
          session.conversations = [...conversations];
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      startBotMessage: (widgetId, chunk) =>
        set((state) => {
          const session = state.sessions[widgetId];
          if (!session || session.conversations.length === 0) return state;
          const { conversations } = session;
          const last = conversations[session.conversations.length - 1];
          if (last.type === 'bot' && last.streaming) {
            last.message = chunk;
            last.timestamp = new Date().toISOString();
          }
          session.isBotThinking = false;
          session.isBotStreaming = true;
          session.currentEvent = null;
          session.conversations = [...conversations];
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      setBotErrorMessage: (widgetId, chunk) =>
        set((state) => {
          const session = state.sessions[widgetId];
          if (!session || session.conversations.length === 0) return state;
          const { conversations } = session;
          const last = conversations[session.conversations.length - 1];
          if (last.type === 'bot' && last.streaming) {
            last.message = chunk;
          }
          session.isBotThinking = false;
          session.isBotStreaming = true;
          session.currentEvent = null;
          session.conversations = [...conversations];
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      streamBotMessage: (widgetId, chunk) =>
        set((state) => {
          const session = state.sessions[widgetId];
          if (!session || session.conversations.length === 0) return state;
          const { conversations } = session;
          const last = conversations[session.conversations.length - 1];
          if (last.type === 'bot' && last.streaming) {
            last.message += chunk;
          }
          session.conversations = [...conversations];
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      endBotMessage: (widgetId) =>
        set((state) => {
          const session = state.sessions[widgetId];
          if (!session || session.conversations.length === 0) return state;
          const { conversations } = session;
          const last = conversations[session.conversations.length - 1];
          if (last.type === 'bot' && last.streaming) {
            last.streaming = false;
          }
          session.isBotStreaming = false;
          session.currentEvent = null;
          session.conversations = [...conversations];
          return {
            sessions: {
              ...state.sessions,
              [widgetId]: { ...session },
            },
          };
        }),

      clearSession: (widgetId) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [widgetId]: {
              sessionId: null,
              conversations: [],
              isBotStreaming: false,
              isBotThinking: false,
              currentEvent: null,
            },
          },
        })),
    }),
    {
      name: 'selise-blocks-chatbot-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
