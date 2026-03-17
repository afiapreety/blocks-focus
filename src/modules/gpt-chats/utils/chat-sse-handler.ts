import type { QueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import { agentService } from '../services/agent.service';
import { parseSSEBuffer } from './parse-sse';
import { Chat, ChatFileMetadata, SSEEvent } from '../types/chat-store.types';

const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';
const llmBasePrompt = import.meta.env.VITE_LLM_BASE_PROMPT || 'You are a helpful AI assistant.';

export const createSSEHandler = async (
  query: string,
  chat: Chat,
  cb: (event: SSEEvent, done: boolean) => void,
  files?: ChatFileMetadata[],
  queryClient?: QueryClient
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
          last_n_turn: 10,
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
      if (queryClient) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          if (chat.sessionId) {
            queryClient.invalidateQueries({
              queryKey: ['conversation', { session_id: chat.sessionId }],
            });
          }
        }, 500);
      }
    }
  } catch (error) {
    console.error('Error in chat SSE handler:', error);
  }
};
