import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, onlineManager, focusManager } from '@tanstack/react-query';
import { useChatPreviewSession } from './use-chat-preview-session';
import { getRandomEventMessage } from '../utils/chat-event-messages';
import { parseSSEBuffer } from '../utils/parse-sse';
import { parseChatMessage } from '../utils/json-utils';
import { conversationService } from '../services/conversation.service';

interface UseChatPreviewSSE {
  widget_id: string;
  project_key: string;
  pg?: boolean;
  previewMode?: boolean;
}

export const handleSSEMessage = (
  widgetId: string,
  event: { eventType: string; eventData: Record<string, unknown> },
  setSuggestions?: (suggestions: string[]) => void
) => {
  const {
    startBotMessage,
    streamBotMessage,
    endBotMessage,
    initiateBotMessage,
    setBotErrorMessage,
    setCurrentEvent,
    setBotThinking,
  } = useChatPreviewSession.getState();

  const data = { type: event.eventType, ...event.eventData } as any;

  const eventTypes = [
    'workflow_start',
    'node_start',
    'planner_decision_task',
    'retrieval_start',
    'retrieval_complete',
    'tool_execution_start',
    'tool_execution_approval_required',
    'tool_execution_complete',
    'subagent_call_start',
    'subagent_call_complete',
    'execution_long_running',
    'partial_failure',
    'execution_failed',
  ];

  const normalizedType = data.type.toLowerCase().replace(/_/g, '_');

  if (eventTypes.includes(normalizedType) || normalizedType.startsWith('node_start')) {
    const eventMessage = getRandomEventMessage(data.type);
    console.log('eventMessage', eventMessage);
    setCurrentEvent(widgetId, data.type, eventMessage);
    setBotThinking(widgetId, true);
    return;
  }

  const fakeStream = (fullMessage: string | object, next_step_questions: string[] = []) => {
    const chunkSize = 5;
    let index = 0;
    let timeoutId: NodeJS.Timeout;
    let messageToStream: string;
    let isJsonObject = false;

    if (typeof fullMessage === 'object' && fullMessage !== null) {
      isJsonObject = true;
      messageToStream = JSON.stringify(fullMessage);
    } else if (typeof fullMessage === 'string') {
      try {
        const parsed = JSON.parse(fullMessage);
        if (typeof parsed === 'object' && parsed !== null) {
          isJsonObject = true;
          messageToStream = fullMessage;
        } else {
          messageToStream = fullMessage;
        }
      } catch {
        messageToStream = fullMessage;
      }
    } else {
      messageToStream = String(fullMessage);
    }

    const { message, suggestions } = parseChatMessage(
      JSON.stringify({
        result: messageToStream,
        next_step_questions,
      })
    );

    const formattedJson = isJsonObject
      ? JSON.stringify(JSON.parse(messageToStream), null, 2)
      : messageToStream;
    const streamContent = isJsonObject ? `:::json\n${formattedJson}\n:::` : String(message);

    startBotMessage(widgetId, '');

    if (isJsonObject) {
      const skeleton = generateJsonSkeleton(JSON.parse(messageToStream));
      const skeletonContent = `:::json-skeleton\n${skeleton}\n:::`;
      streamBotMessage(widgetId, skeletonContent);

      timeoutId = setTimeout(() => {
        startBotMessage(widgetId, '');
        streamBotMessage(widgetId, streamContent);
        if (setSuggestions) setSuggestions(suggestions);
        endBotMessage(widgetId);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }

    const sendNextChunk = () => {
      if (index >= streamContent.length) {
        if (setSuggestions) setSuggestions(suggestions);
        endBotMessage(widgetId);
        return;
      }

      let chunk: string;
      if (isJsonObject && index + chunkSize < streamContent.length) {
        const endIndex = Math.min(index + chunkSize * 2, streamContent.length);
        const segment = streamContent.slice(index, endIndex);
        const breakPoints = [',', ':', '{', '}', '[', ']', ' '];

        let breakAt = chunkSize;
        for (let i = chunkSize; i < segment.length && i < chunkSize * 2; i++) {
          if (breakPoints.includes(segment[i])) {
            breakAt = i + 1;
            break;
          }
        }
        chunk = streamContent.slice(index, index + breakAt);
      } else {
        chunk = streamContent.slice(index, index + chunkSize);
      }

      streamBotMessage(widgetId, chunk);
      index += chunk.length;
      timeoutId = setTimeout(sendNextChunk, 50);
    };

    sendNextChunk();
    return () => clearTimeout(timeoutId);
  };

  const generateJsonSkeleton = (obj: unknown, indent = 0): string => {
    const spaces = '  '.repeat(indent);

    if (obj === null) return `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`;

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return [
          `${spaces}▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
        ].join('\n');
      }
      const items = obj.slice(0, 6).map((item) => generateJsonSkeleton(item, indent + 1));
      const hasMore = obj.length > 6 ? `\n\n${spaces}   ▒▒▒   ▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒   ▒▒▒▒` : '';
      return `${items.join('\n\n')}${hasMore}`;
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return [
          `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
          ``,
          `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒`,
        ].join('\n');
      }

      const entries = keys.slice(0, 10).map((key) => {
        const value = (obj as Record<string, unknown>)[key];
        const skeletonKey = '▒'.repeat(Math.min(Math.max(key.length, 8), 18));
        const skeletonValue = getSkeletonValue(value, indent + 1);
        return `${spaces}${skeletonKey}   ${skeletonValue}`;
      });

      const fillerLines = [
        `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
        `${spaces}▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
        `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒`,
        `${spaces}▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
        `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`,
      ];

      const hasMore =
        keys.length > 10 ? `\n\n${spaces}▒▒▒   ▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒` : '';

      const neededFillers = Math.max(0, 12 - keys.length);
      const extraLines =
        neededFillers > 0 ? '\n\n' + fillerLines.slice(0, neededFillers).join('\n\n') : '';

      return `${entries.join('\n\n')}${extraLines}${hasMore}`;
    }

    return getSkeletonValue(obj, indent);
  };

  const getSkeletonValue = (value: unknown, indent: number): string => {
    const spaces = '  '.repeat(indent);

    if (value === null) return '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ';
    if (typeof value === 'string') {
      const blockLength = Math.min(Math.max(value.length, 12), 40);
      return '▒'.repeat(blockLength);
    }
    if (typeof value === 'number') {
      const blockLength = Math.min(String(value).length + 6, 16);
      return '▒'.repeat(blockLength);
    }
    if (typeof value === 'boolean') return '▒▒▒▒▒▒▒▒▒▒▒▒';
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `\n${spaces}▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒\n\n${spaces}▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`;
      }
      const items = value.slice(0, 4).map((item) => {
        if (typeof item === 'object' && item !== null) {
          return generateJsonSkeleton(item, indent);
        }
        return `${spaces}▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`;
      });
      const hasMore = value.length > 4 ? `\n\n${spaces}▒▒▒▒▒▒   ▒▒▒▒   ▒▒▒▒▒▒` : '';
      return '\n' + items.join('\n\n') + hasMore;
    }
    if (typeof value === 'object' && value !== null) {
      // For nested objects, create indented block lines
      return '\n' + generateJsonSkeleton(value, indent);
    }
    return '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒';
  };

  switch (data.type) {
    case 'typing':
      break;

    case 'message_start':
      break;

    case 'chat_response':
      setCurrentEvent(widgetId, null, '');
      initiateBotMessage(widgetId, data.message);
      fakeStream(data.message, data.next_step_questions || []);
      break;

    case 'error':
      setCurrentEvent(widgetId, null, '');
      initiateBotMessage(widgetId, data.message);
      setBotErrorMessage(widgetId, data.message);
      endBotMessage(widgetId);
      break;

    case 'message_end':
    case 'workflow_end':
      setCurrentEvent(widgetId, null, '');
      setBotThinking(widgetId, false);
      break;

    default:
  }
};

const useInitiateConversation = () =>
  useMutation({
    mutationKey: ['chatbot', 'initiate'],
    mutationFn: conversationService.initiate,
  });

export const useChatPreviewSSE = ({
  widget_id,
  project_key,
  previewMode = false,
}: UseChatPreviewSSE) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { sessions, setSessionId, addUserMessage, setBotThinking, setCurrentEvent } =
    useChatPreviewSession();
  const [isConnected, setIsConnected] = useState(false);
  const { mutateAsync: initiateConversationMutation } = useInitiateConversation();
  const sessionId = sessions[widget_id]?.sessionId || '';
  const conversations = sessions[widget_id]?.conversations || [];
  const isBotStreaming = sessions[widget_id]?.isBotStreaming || false;
  const isBotThinking = sessions[widget_id]?.isBotThinking || false;

  const streamInfoRef = useRef<{ token: string } | null>(null);
  const connectingRef = useRef<boolean>(false);
  const retriesRef = useRef<number>(0);

  const connect = useCallback(
    async (currentSessionId: string) => {
      if (connectingRef.current) return;

      const retryHandler = () => {
        retriesRef.current += 1;
        if (retriesRef.current > 5) return;
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
        setTimeout(() => {
          connect(currentSessionId);
        }, delay);
      };

      try {
        connectingRef.current = true;
        const res = await initiateConversationMutation({
          widget_id,
          project_key,
          session_id: currentSessionId,
        });
        if (!res.is_success) throw new Error(res.detail || 'Initiation failed');

        streamInfoRef.current = {
          token: res.token,
        };

        setSessionId(widget_id, res.session_id);
        setIsConnected(true);
        connectingRef.current = false;
        retriesRef.current = 0;
      } catch (error) {
        connectingRef.current = false;
        setIsConnected(false);

        // if (isErrorWithErrors(error)) {
        //   if (
        //     (error.errors as { detail: string })?.detail?.toLowerCase() ===
        //     'Session creation failed'.toLowerCase()
        //   ) {
        //     setSessionId(widget_id, '');
        //     return retryHandler();
        //   }
        // }
        if (
          (error as { message: string })?.message?.toLowerCase() ===
          'Session not found'.toLowerCase()
        ) {
          if (currentSessionId) connect('');
          else retryHandler();
          return;
        }
        retryHandler();
      }
    },
    [initiateConversationMutation, setSessionId, widget_id, project_key]
  );

  // Connect on mount
  useEffect(() => {
    if (!previewMode) {
      connect(sessionId);
    }
  }, [connect, sessionId, previewMode]);

  useEffect(() => {
    if (previewMode) return;
    const unsubscribe = onlineManager.subscribe((isOnline) => {
      if (isOnline) connect(sessionId);
    });
    return () => unsubscribe();
  }, [connect, sessionId, previewMode]);

  useEffect(() => {
    if (previewMode) return;
    const unsubscribe = focusManager.subscribe((isVisible) => {
      if (isVisible) connect(sessionId);
    });
    return () => unsubscribe();
  }, [connect, sessionId, previewMode]);

  const sendMessage = async (data: { message: string }) => {
    if (!streamInfoRef.current) {
      if (isConnected) connect(sessionId);
      return;
    }

    addUserMessage(widget_id, data.message);
    setBotThinking(widget_id, true);
    setSuggestions([]);

    try {
      const token = streamInfoRef.current.token;
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/blocksai-api/v1/chat/${sessionId}?x_blocks_token=${token}&x_blocks_key=${project_key}&pg=true&se=true`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blocks-token': token,
          'x-blocks-key': project_key,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText || 'Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSEBuffer(buffer);
          buffer = remaining;

          events.forEach((event) => {
            handleSSEMessage(widget_id, event, setSuggestions);
          });
        }

        if (done) {
          break;
        }
      }
    } catch (error) {
      setBotThinking(widget_id, false);
      setCurrentEvent(widget_id, null, '');
    }
  };

  return {
    isConnected,
    sessionId,
    sendMessage,
    conversations,
    isBotThinking,
    isBotStreaming,
    suggestions,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setIsUserIdle: () => {},
  };
};
