import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { QueryClient } from '@tanstack/react-query';
import { Conversation } from '../types/conversation.service.type';
import { conversationService } from '../services/conversation.service';
import { parseSSEBuffer } from '../utils/parse-sse';
import { handleSSEMessage } from '../utils/sse-message-handler';
import { NavigateFunction } from 'react-router-dom';
import { agentService } from '../services/agent.service';
import { processFileStream } from '../utils/process-file-stream';

const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';
const llmBasePrompt = import.meta.env.VITE_LLM_BASE_PROMPT || 'You are a helpful AI assistant.';

// Type for file processing callback - to be provided by React Query hook layer
export type ProcessFilesCallback = (params: {
  session_id: string;
  call_from: string;
  file_ids: string[];
}) => Promise<{ success: boolean; message?: string }>;

const generateUniqueId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type MessageType = 'user' | 'bot';

export type SelectModelType = {
  isBlocksModels: boolean;
  provider: string;
  model: string;
  widget_id?: string;
};

interface ChatMessage {
  message: string;
  type: MessageType;
  streaming: boolean;
  timestamp: string;
  metadata?: {
    tool_calls_made?: number;
  };
  tokenUsage?: {
    model_name?: string;
  };
  files?: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>;
}

interface Chat {
  id: string | null;
  sessionId: string | null;
  conversations: ChatMessage[];
  isBotStreaming: boolean;
  isBotThinking: boolean;
  currentEvent: ChatEvent | null;
  lastUpdated: string;
  selectedModel: SelectModelType;
  selectedTools: string[];
  processedFileIds: string[];
  sessionFiles: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>;
}

interface ChatEvent {
  type: string;
  message: string;
}

const chatDefaultValue: Chat = {
  id: null,
  conversations: [],
  sessionId: null,
  isBotStreaming: false,
  isBotThinking: false,
  currentEvent: null as ChatEvent | null,
  lastUpdated: '',
  selectedModel: { isBlocksModels: true, provider: 'azure', model: 'gpt-4o-mini' },
  selectedTools: [],
  processedFileIds: [],
  sessionFiles: [],
};

interface ChatStore {
  chats: {
    [id: string]: Chat;
  };
  resolveChatId: (chatId: string) => string;
  activeChatId: string | null;
  startChat: (
    message: string,
    model: SelectModelType,
    tools: string[],
    navigate: NavigateFunction,
    queryClient?: QueryClient,
    files?: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>,
    processFilesCallback?: ProcessFilesCallback
  ) => void;
  loadChat: (id: string, conversations: Conversation[]) => void;
  loadAgentChat: (
    id: string,
    conversations: Conversation[],
    agentId: string,
    widgetId?: string
  ) => void;
  setSessionId: (id: string, sessionId: string) => void;
  addUserMessage: (
    id: string,
    message: string,
    files?: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>
  ) => void;
  initiateBotMessage: (id: string, chunk: string) => void;
  startBotMessage: (id: string, chunk: string) => void;
  streamBotMessage: (id: string, chunk: string) => void;
  setBotErrorMessage: (id: string, chunk: string) => void;
  endBotMessage: (id: string) => void;
  clearChat: (id: string) => void;
  setBotThinking: (id: string, thinking: boolean) => void;
  setCurrentEvent: (id: string, eventType: string | null, message: string) => void;
  setSelectedModel: (id: string, model: SelectModelType) => void;
  setSelectedTools: (id: string, toolIds: string[]) => void;
  deleteChat: (id: string) => void;
  generateBotMessage: (
    id: string,
    message: string,
    setSuggestions?: (suggestions: string[]) => void,
    files?: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>,
    isNewFileUpload?: boolean,
    processFilesCallback?: ProcessFilesCallback
  ) => Promise<void>;
  sendMessage: (
    id: string,
    message: string,
    files?: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>,
    processFilesCallback?: ProcessFilesCallback
  ) => Promise<void>;
  reset: () => void;
}

const getBotSSE = async (
  query: string,
  chat: Chat,
  cb: (
    event: {
      eventType: string;
      eventData: { session_id?: string; query?: string; message?: string };
    },
    done: boolean
  ) => void,
  files?: Array<{ fileId: string; fileName: string; fileUrl: string; extension: string }>
) => {
  const modelId = chat?.selectedModel
    ? chat?.selectedModel.isBlocksModels
      ? ''
      : chat?.selectedModel.model
    : '';
  const modelName = chat?.selectedModel
    ? chat?.selectedModel.isBlocksModels
      ? chat?.selectedModel.model
      : ''
    : '';
  const modelProvider = chat?.selectedModel
    ? chat?.selectedModel.isBlocksModels
      ? chat?.selectedModel.provider
      : ''
    : '';

  const isAgent = chat?.selectedModel?.provider === 'agents' && chat?.selectedModel?.widget_id;

  try {
    const reader = isAgent
      ? await agentService.agentChatStream(
          chat.selectedModel.widget_id as string,
          {
            message: query,
            message_type: 'text',
          },
          chat.sessionId as string | undefined
        )
      : await conversationService.query({
          query: query,
          session_id: (chat.sessionId as string) || undefined,
          base_prompt: llmBasePrompt,
          model_id: modelId,
          model_name: modelName,
          model_provider: modelProvider,
          tool_ids: chat.selectedTools,
          last_n_turn: 5,
          enable_summary: true,
          enable_next_suggestion: true,
          response_type: 'text',
          response_format: 'string',
          call_from: projectSlug,
          files: files?.map((f) => ({
            extension: f.extension,
            file_id: f.fileId,
          })),
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

    if (isDone) {
      cb({ eventType: 'stream_complete', eventData: {} }, true);
    }
  } catch (error) {
    //
  }
};

export const useChatStore = create<ChatStore>()(
  persist<ChatStore>(
    (set, get) => ({
      chats: {},
      activeChatId: null as string | null,

      resolveChatId: (chatId) => {
        const state = get();
        if (chatId === 'new') {
          return state.activeChatId || '';
        }
        return chatId;
      },

      startChat: (message, model, tools, navigate, queryClient, files, processFilesCallback) => {
        const chatMessage: ChatMessage = {
          message,
          type: 'user',
          streaming: false,
          timestamp: new Date().toISOString(),
          ...(files && files.length > 0 && { files }),
        };

        const chatId = generateUniqueId();
        const chat = {
          ...chatDefaultValue,
          id: chatId,
          conversations: [chatMessage],
          isBotThinking: true,
          lastUpdated: new Date().toISOString(),
          selectedModel: model,
          selectedTools: tools,
          sessionFiles: files || [],
        };

        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: chat,
          },
          activeChatId: chatId,
        }));

        navigate(`/chat/new`);

        let receivedSessionId: string | null = null;
        let migrationScheduled = false;

        // Handle file processing for unstructured files
        const processFilesAndSendMessage = async () => {
          try {
            // If files are present, we need to get session_id first
            if (files && files.length > 0) {
              // Send user message to get session_id (use actual message for proper chat title)
              const initReader = await conversationService.query({
                query: message,
                base_prompt: llmBasePrompt,
                model_id: '',
                model_name: chat.selectedModel.isBlocksModels ? chat.selectedModel.model : '',
                model_provider: chat.selectedModel.isBlocksModels
                  ? chat.selectedModel.provider
                  : '',
                tool_ids: tools,
                last_n_turn: 5,
                enable_summary: true,
                enable_next_suggestion: true,
                response_type: 'text',
                response_format: 'string',
                call_from: projectSlug,
              });

              // Read the response to get session_id
              const decoder = new TextDecoder();
              let buffer = '';
              let isDone = false;
              while (!isDone) {
                const { done, value } = await initReader.read();
                isDone = done;
                if (done) break;
                if (value) {
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const data = JSON.parse(line.slice(6));
                        if (data.session_id && !receivedSessionId) {
                          receivedSessionId = data.session_id;
                          set((state) => ({
                            chats: {
                              ...state.chats,
                              [chatId]: {
                                ...state.chats[chatId],
                                sessionId: receivedSessionId,
                              },
                            },
                          }));

                          // Update URL immediately with session ID (like ChatGPT)
                          const isAgentChat = chat.selectedModel?.provider === 'agents';
                          const newUrl = isAgentChat
                            ? `/chat/${receivedSessionId}?agent=${chat.selectedModel.model}&widget=${chat.selectedModel.widget_id}`
                            : `/chat/${receivedSessionId}`;
                          window.history.replaceState(null, '', newUrl);

                          // Optimistically add chat to sidebar to avoid flicker
                          if (queryClient) {
                            const queryKey = isAgentChat
                              ? ['agent-conversation-list']
                              : ['conversations'];

                            // Add placeholder entry immediately
                            queryClient.setQueryData(queryKey, (oldData: any) => {
                              if (!oldData?.pages) return oldData;

                              const newSession = {
                                session_id: receivedSessionId,
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

                            // Invalidate after delay to get real data from backend
                            setTimeout(() => {
                              if (isAgentChat) {
                                queryClient.invalidateQueries({
                                  queryKey: ['agent-conversation-list'],
                                });
                              } else {
                                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                              }
                            }, 2000);
                          }

                          break;
                        }
                      } catch (e) {
                        // Ignore parse errors
                      }
                    }
                  }
                  if (receivedSessionId) break;
                }
              }

              // Process unstructured files
              if (receivedSessionId) {
                const unstructuredExtensions = ['.pdf', '.docx', '.txt', '.html', '.md', '.doc'];
                const unstructuredFiles = files.filter((f) =>
                  unstructuredExtensions.includes(f.extension)
                );

                if (unstructuredFiles.length > 0) {
                  // Use callback if provided (from React Query hook), otherwise fallback to direct service call
                  const processResult = processFilesCallback
                    ? await processFilesCallback({
                        session_id: receivedSessionId,
                        call_from: projectSlug,
                        file_ids: unstructuredFiles.map((f) => f.fileId),
                      })
                    : await processFileStream(
                        await agentService.processFiles({
                          session_id: receivedSessionId,
                          call_from: projectSlug,
                          file_ids: unstructuredFiles.map((f) => f.fileId),
                        })
                      );

                  if (!processResult.success) {
                    set((state) => ({
                      chats: {
                        ...state.chats,
                        [chatId]: {
                          ...state.chats[chatId],
                          conversations: [
                            ...state.chats[chatId].conversations,
                            {
                              message: `⚠️ File processing failed: ${processResult.message}. The AI may not be able to access the file content.`,
                              type: 'bot',
                              streaming: false,
                              timestamp: new Date().toISOString(),
                            },
                          ],
                        },
                      },
                    }));
                  }
                }

                // Update chat with session_id
                set((state) => ({
                  chats: {
                    ...state.chats,
                    [chatId]: {
                      ...state.chats[chatId],
                      sessionId: receivedSessionId,
                      processedFileIds: files.map((f) => f.fileId),
                      sessionFiles: files,
                    },
                  },
                }));
              }
            }
          } catch (error) {
            // Session setup failed - error handling can be added here if needed
          }
        };

        // Process files first if present, then send the actual message
        if (files && files.length > 0) {
          processFilesAndSendMessage().then(() => {
            // Enhance query with file context when files are attached
            let enhancedQuery = message;
            if (files.length === 1) {
              const fileName = files[0].fileName;
              enhancedQuery = `[Context: User has attached 1 file: ${fileName}. Focus on this specific file.]\n\n${message}`;
            } else {
              const fileNames = files.map((f) => f.fileName).join(', ');
              enhancedQuery = `[Context: User has attached ${files.length} files: ${fileNames}. IMPORTANT: Analyze and provide information about ALL ${files.length} files, not just one. Address each file separately in your response.]\n\n${message}`;
            }

            getBotSSE(
              enhancedQuery,
              { ...chat, sessionId: receivedSessionId || chat.sessionId },
              (event, done) => {
                if (event.eventData.session_id && !receivedSessionId) {
                  receivedSessionId = event.eventData.session_id;
                  set((state) => ({
                    chats: {
                      ...state.chats,
                      [chatId]: {
                        ...state.chats[chatId],
                        sessionId: receivedSessionId,
                      },
                    },
                  }));

                  // Update URL immediately with session ID (like ChatGPT)
                  const isAgentChat = chat.selectedModel?.provider === 'agents';
                  const newUrl = isAgentChat
                    ? `/chat/${receivedSessionId}?agent=${chat.selectedModel.model}&widget=${chat.selectedModel.widget_id}`
                    : `/chat/${receivedSessionId}`;
                  window.history.replaceState(null, '', newUrl);

                  // Optimistically add chat to sidebar to avoid flicker
                  if (queryClient) {
                    const queryKey = isAgentChat ? ['agent-conversation-list'] : ['conversations'];

                    // Add placeholder entry immediately
                    queryClient.setQueryData(queryKey, (oldData: any) => {
                      if (!oldData?.pages) return oldData;

                      const newSession = {
                        session_id: receivedSessionId,
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

                    // Invalidate after delay to get real data from backend
                    setTimeout(() => {
                      if (isAgentChat) {
                        queryClient.invalidateQueries({ queryKey: ['agent-conversation-list'] });
                      } else {
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                      }
                    }, 2000);
                  }
                }

                handleSSEMessage(chatId, event, undefined);

                if (done && !migrationScheduled && receivedSessionId) {
                  migrationScheduled = true;

                  const checkAndMigrate = () => {
                    const currentChat = get().chats[chatId];

                    if (!currentChat) {
                      return;
                    }

                    if (!currentChat.isBotStreaming && !currentChat.isBotThinking) {
                      performMigration();
                    } else {
                      setTimeout(checkAndMigrate, 50);
                    }
                  };

                  setTimeout(checkAndMigrate, 50);
                }
              },
              files
            );
          });
        } else {
          getBotSSE(
            message,
            chat,
            (event, done) => {
              if (event.eventData.session_id && !receivedSessionId) {
                receivedSessionId = event.eventData.session_id;
                set((state) => ({
                  chats: {
                    ...state.chats,
                    [chatId]: {
                      ...state.chats[chatId],
                      sessionId: receivedSessionId,
                    },
                  },
                }));

                // Update URL immediately with session ID (like ChatGPT)
                const isAgentChat = chat.selectedModel?.provider === 'agents';
                const newUrl = isAgentChat
                  ? `/chat/${receivedSessionId}?agent=${chat.selectedModel.model}&widget=${chat.selectedModel.widget_id}`
                  : `/chat/${receivedSessionId}`;
                window.history.replaceState(null, '', newUrl);

                // Optimistically add chat to sidebar to avoid flicker
                if (queryClient) {
                  const queryKey = isAgentChat ? ['agent-conversation-list'] : ['conversations'];

                  // Add placeholder entry immediately
                  queryClient.setQueryData(queryKey, (oldData: any) => {
                    if (!oldData?.pages) return oldData;

                    const newSession = {
                      session_id: receivedSessionId,
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

                  // Invalidate after delay to get real data from backend
                  setTimeout(() => {
                    if (isAgentChat) {
                      queryClient.invalidateQueries({ queryKey: ['agent-conversation-list'] });
                    } else {
                      queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    }
                  }, 2000);
                }
              }

              handleSSEMessage(chatId, event, undefined);

              if (done && !migrationScheduled && receivedSessionId) {
                migrationScheduled = true;

                const checkAndMigrate = () => {
                  const currentChat = get().chats[chatId];

                  if (!currentChat) {
                    return;
                  }

                  if (!currentChat.isBotStreaming && !currentChat.isBotThinking) {
                    performMigration();
                  } else {
                    setTimeout(checkAndMigrate, 50);
                  }
                };

                setTimeout(checkAndMigrate, 50);
              }
            },
            files
          );
        }

        const performMigration = () => {
          if (!receivedSessionId) {
            return;
          }

          const currentChat = get().chats[chatId];

          if (!currentChat) {
            return;
          }

          set((state) => ({
            chats: {
              ...state.chats,
              [receivedSessionId as string]: {
                ...currentChat,
                id: receivedSessionId,
                sessionId: receivedSessionId,
              },
            },
            activeChatId: receivedSessionId,
          }));

          const updatedChats = { ...get().chats };
          delete updatedChats[chatId];
          set({ chats: updatedChats });

          const isAgentChat = currentChat.selectedModel?.provider === 'agents';
          const newUrl = isAgentChat
            ? `/chat/${receivedSessionId}?agent=${currentChat.selectedModel.model}&widget=${currentChat.selectedModel.widget_id}`
            : `/chat/${receivedSessionId}`;
          window.history.replaceState(null, '', newUrl);

          if (queryClient) {
            if (isAgentChat) {
              queryClient.refetchQueries({ queryKey: ['agent-conversation-list'] });
            } else {
              queryClient.refetchQueries({ queryKey: ['conversations'] });
            }
          }
        };

        return {};
      },

      loadChat: (id, conversations) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          const chatConversations: ChatMessage[] = conversations.flatMap((conversation: any) => {
            const tokenUsage = conversation.conversation?.TokenUsage || conversation.TokenUsage;
            const metadata = conversation.conversation?.Metadata || conversation.Metadata;

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
                metadata: metadata
                  ? {
                      tool_calls_made: metadata.tool_calls_made,
                    }
                  : undefined,
                tokenUsage: tokenUsage
                  ? {
                      model_name: tokenUsage.model_name,
                    }
                  : undefined,
              },
            ];
          });
          if (!chat.selectedModel) {
            chat.selectedModel = { isBlocksModels: true, provider: 'azure', model: 'gpt-4o-mini' };
          }
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

      loadAgentChat: (id, conversations, agentId, widgetId) =>
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          const chatConversations: ChatMessage[] = conversations
            .sort(
              (a, b) => new Date(a.QueryTimestamp).getTime() - new Date(b.QueryTimestamp).getTime()
            )
            .flatMap((conversation: any) => {
              const tokenUsage = conversation.conversation?.TokenUsage || conversation.TokenUsage;
              const metadata = conversation.conversation?.Metadata || conversation.Metadata;

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
                  metadata: metadata
                    ? {
                        tool_calls_made: metadata.tool_calls_made,
                      }
                    : undefined,
                  tokenUsage: tokenUsage
                    ? {
                        model_name: tokenUsage.model_name,
                      }
                    : undefined,
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
                selectedModel: {
                  isBlocksModels: false,
                  provider: 'agents',
                  model: agentId,
                  widget_id: widgetId,
                },
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

      addUserMessage: (id, message, files) =>
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
                    ...(files && files.length > 0 && { files }),
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

      generateBotMessage: async (
        id,
        message,
        setSuggestions,
        files,
        isNewFileUpload = false,
        processFilesCallback
      ) => {
        const state = get();
        const chat = state.chats[id];

        state.setBotThinking(id, true);
        if (setSuggestions) setSuggestions([]);

        // Process unstructured files if present and not already processed
        if (files && files.length > 0 && chat.sessionId) {
          try {
            // Separate structured and unstructured files
            const unstructuredExtensions = ['.pdf', '.docx', '.txt', '.html', '.md', '.doc'];
            const unstructuredFiles = files.filter((f) =>
              unstructuredExtensions.includes(f.extension)
            );

            // Filter out already processed unstructured files
            const unprocessedUnstructuredFiles = unstructuredFiles.filter(
              (f) => !chat.processedFileIds.includes(f.fileId)
            );

            // Only process unstructured files that haven't been processed yet
            if (unprocessedUnstructuredFiles.length > 0) {
              // Use callback if provided (from React Query hook), otherwise fallback to direct service call
              const processResult = processFilesCallback
                ? await processFilesCallback({
                    session_id: chat.sessionId,
                    call_from: projectSlug,
                    file_ids: unprocessedUnstructuredFiles.map((f) => f.fileId),
                  })
                : await processFileStream(
                    await agentService.processFiles({
                      session_id: chat.sessionId,
                      call_from: projectSlug,
                      file_ids: unprocessedUnstructuredFiles.map((f) => f.fileId),
                    })
                  );

              if (!processResult.success) {
                set((state) => ({
                  chats: {
                    ...state.chats,
                    [id]: {
                      ...state.chats[id],
                      conversations: [
                        ...state.chats[id].conversations,
                        {
                          message: `⚠️ File processing failed: ${processResult.message}. The AI may not be able to access the file content.`,
                          type: 'bot',
                          streaming: false,
                          timestamp: new Date().toISOString(),
                        },
                      ],
                    },
                  },
                }));
              } else {
                // Track only unstructured files as processed (they only need processing once)
                set((state) => ({
                  chats: {
                    ...state.chats,
                    [id]: {
                      ...state.chats[id],
                      processedFileIds: [
                        ...state.chats[id].processedFileIds,
                        ...unprocessedUnstructuredFiles.map((f) => f.fileId),
                      ],
                    },
                  },
                }));
              }
            }
          } catch (error) {
            // File processing error - error handling can be added here if needed
          }
        }

        try {
          // Only enhance query with file context when NEW files are attached
          let enhancedQuery = message;
          if (isNewFileUpload && files && files.length > 0) {
            const fileNames = files.map((f) => f.fileName).join(', ');
            if (files.length === 1) {
              enhancedQuery = `[Context: User has attached 1 file: ${fileNames}. Focus on this specific file.]\n\n${message}`;
            } else {
              enhancedQuery = `[Context: User has attached ${files.length} files: ${fileNames}. IMPORTANT: Analyze and provide information about ALL ${files.length} files, not just one. Address each file separately in your response.]\n\n${message}`;
            }
          }

          getBotSSE(
            enhancedQuery,
            chat,
            (event) => {
              handleSSEMessage(id, event, undefined);
            },
            files
          );
        } catch (error) {
          state.setBotThinking(id, false);
          state.setCurrentEvent(id, null, '');
        }
      },

      sendMessage: async (id, message, files, processFilesCallback) => {
        const state = get();
        const chat = state.chats[id];

        // Merge new files with existing session files for tracking (avoid duplicates)
        if (files && files.length > 0) {
          const updatedSessionFiles = [...(chat?.sessionFiles || [])];
          files.forEach((newFile) => {
            if (!updatedSessionFiles.some((f) => f.fileId === newFile.fileId)) {
              updatedSessionFiles.push(newFile);
            }
          });

          // Update session files in the chat for tracking purposes
          set((state) => ({
            chats: {
              ...state.chats,
              [id]: {
                ...state.chats[id],
                sessionFiles: updatedSessionFiles,
              },
            },
          }));
        }

        state.addUserMessage(id, message, files);
        // Always pass all session files to maintain context across the conversation
        const currentSessionFiles = get().chats[id]?.sessionFiles || [];
        const hasNewFiles = files && files.length > 0;
        await state.generateBotMessage(
          id,
          message,
          undefined,
          currentSessionFiles.length > 0 ? currentSessionFiles : undefined,
          hasNewFiles,
          processFilesCallback
        );
      },

      setSelectedModel: (id, model) => {
        set((state) => {
          const chat = state.chats[id] || { ...chatDefaultValue, id };
          return {
            chats: {
              ...state.chats,
              [id]: {
                ...chat,
                selectedModel: model,
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
