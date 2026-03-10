import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { QueryClient } from '@tanstack/react-query';
import { NavigateFunction } from 'react-router-dom';
import { Conversation } from '../types/conversation.service.type';
import { conversationService } from '../services/conversation.service';
import { handleSSEMessage } from '../utils/sse-message-handler';
import { parseChatMessage } from '../utils/json-utils';
import {
  ProcessFilesCallback,
  ChatFileMetadata,
  SelectModelType,
  ChatMessage,
  Chat,
  chatDefaultValue,
} from '../types/chat-store.types';
import { createSSEHandler } from '../utils/chat-sse-handler';
import {
  processUnstructuredFiles,
  enhanceQueryWithFileContext,
} from '../utils/chat-file-processor';
import { syncChatToSidebar, updateUrlWithSessionId } from '../utils/chat-session-sync';
import { generateUniqueId } from '../utils/chat-helpers';
import {
  handleSSEParseError,
  handleFileProcessingError,
  handleSessionSetupError,
  handleStreamError,
  createFileProcessingErrorMessage,
} from '../utils/chat-error-handler';
import { UNSTRUCTURED_EXTENSIONS } from '../utils/chat-file-processor';

const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';
const llmBasePrompt = import.meta.env.VITE_LLM_BASE_PROMPT || 'You are a helpful AI assistant.';

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
    files?: ChatFileMetadata[],
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
  addUserMessage: (id: string, message: string, files?: ChatFileMetadata[]) => void;
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
    files?: ChatFileMetadata[],
    isNewFileUpload?: boolean,
    processFilesCallback?: ProcessFilesCallback
  ) => Promise<void>;
  sendMessage: (
    id: string,
    message: string,
    files?: ChatFileMetadata[],
    processFilesCallback?: ProcessFilesCallback
  ) => Promise<void>;
  reset: () => void;
}

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

                          updateUrlWithSessionId(receivedSessionId, chat.selectedModel);

                          if (queryClient) {
                            syncChatToSidebar(
                              queryClient,
                              receivedSessionId,
                              message,
                              chat.selectedModel
                            );
                          }

                          break;
                        }
                      } catch (e) {
                        handleSSEParseError(e);
                      }
                    }
                  }
                  if (receivedSessionId) break;
                }
              }

              if (receivedSessionId) {
                const processResult = await processUnstructuredFiles(
                  receivedSessionId,
                  files,
                  processFilesCallback
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
                            message: createFileProcessingErrorMessage(processResult.message),
                            type: 'bot',
                            streaming: false,
                            timestamp: new Date().toISOString(),
                          },
                        ],
                      },
                    },
                  }));
                }

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
            handleSessionSetupError(chatId, error, set);
          }
        };

        if (files && files.length > 0) {
          processFilesAndSendMessage().then(() => {
            const enhancedQuery = enhanceQueryWithFileContext(message, files);

            createSSEHandler(
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

                  updateUrlWithSessionId(receivedSessionId, chat.selectedModel);

                  if (queryClient) {
                    syncChatToSidebar(queryClient, receivedSessionId, message, chat.selectedModel);
                  }
                }

                handleSSEMessage(chatId, event, undefined);

                if (done && event.eventType === 'stream_complete') {
                  const state = get();
                  state.setBotThinking(chatId, false);
                }

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
          createSSEHandler(
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

                updateUrlWithSessionId(receivedSessionId, chat.selectedModel);

                if (queryClient) {
                  syncChatToSidebar(queryClient, receivedSessionId, message, chat.selectedModel);
                }
              }

              handleSSEMessage(chatId, event, undefined);

              if (done && event.eventType === 'stream_complete') {
                const state = get();
                state.setBotThinking(chatId, false);
              }

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
            const parsedResponse = parseChatMessage(conversation.Response || '');

            return [
              {
                message: conversation.Query,
                type: 'user',
                streaming: false,
                timestamp: conversation.QueryTimestamp,
              },
              {
                message: parsedResponse.message || conversation.Response,
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
              const parsedResponse = parseChatMessage(conversation.Response || '');

              return [
                {
                  message: conversation.Query,
                  type: 'user',
                  streaming: false,
                  timestamp: conversation.QueryTimestamp,
                },
                {
                  message: parsedResponse.message || conversation.Response,
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
            const unstructuredFiles = files.filter((f) =>
              UNSTRUCTURED_EXTENSIONS.includes(f.extension)
            );

            const unprocessedUnstructuredFiles = unstructuredFiles.filter(
              (f) => !chat.processedFileIds.includes(f.fileId)
            );

            if (unprocessedUnstructuredFiles.length > 0) {
              const processResult = await processUnstructuredFiles(
                chat.sessionId as string,
                unprocessedUnstructuredFiles,
                processFilesCallback
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
                          message: createFileProcessingErrorMessage(processResult.message),
                          type: 'bot',
                          streaming: false,
                          timestamp: new Date().toISOString(),
                        },
                      ],
                    },
                  },
                }));
              } else {
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
            handleFileProcessingError(id, error, set);
          }
        }

        try {
          // Only enhance query with file context when NEW files are attached
          const enhancedQuery =
            isNewFileUpload && files && files.length > 0
              ? enhanceQueryWithFileContext(message, files)
              : message;

          createSSEHandler(
            enhancedQuery,
            chat,
            (event, done) => {
              handleSSEMessage(id, event, undefined);

              // Only turn off thinking state when stream completes, let handleSSEMessage manage endBotMessage
              if (done && event.eventType === 'stream_complete') {
                state.setBotThinking(id, false);
              }
            },
            files
          );
        } catch (error) {
          handleStreamError(id, set);
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
