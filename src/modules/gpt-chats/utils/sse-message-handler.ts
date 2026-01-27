import { useChatStore } from '../hooks/use-chat-store';
import { getRandomEventMessage } from './chat-event-messages';
import { parseChatMessage } from './json-utils';

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
        `${spaces}▒▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒▒▒▒`,
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

    const hasMore = keys.length > 10 ? `\n\n${spaces}▒▒▒   ▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒` : '';

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
    return '\n' + generateJsonSkeleton(value, indent);
  }
  return '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒';
};

export const handleSSEMessage = (
  chatId: string,
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
    setSessionId,
  } = useChatStore.getState();

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
    setCurrentEvent(chatId, data.type, eventMessage);
    setBotThinking(chatId, true);
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

    startBotMessage(chatId, '');

    if (isJsonObject) {
      const skeleton = generateJsonSkeleton(JSON.parse(messageToStream));
      const skeletonContent = `:::json-skeleton\n${skeleton}\n:::`;
      streamBotMessage(chatId, skeletonContent);

      timeoutId = setTimeout(() => {
        startBotMessage(chatId, '');
        streamBotMessage(chatId, streamContent);
        if (setSuggestions) setSuggestions(suggestions);
        endBotMessage(chatId);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }

    const sendNextChunk = () => {
      if (index >= streamContent.length) {
        if (setSuggestions) setSuggestions(suggestions);
        endBotMessage(chatId);
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

      streamBotMessage(chatId, chunk);
      index += chunk.length;
      timeoutId = setTimeout(sendNextChunk, 50);
    };

    sendNextChunk();
    return () => clearTimeout(timeoutId);
  };

  switch (data.type) {
    case 'start':
      setSessionId(chatId, data.session_id);
      break;
    case 'typing':
      break;

    case 'message_start':
      break;

    case 'chat_response':
      setCurrentEvent(chatId, null, '');
      initiateBotMessage(chatId, data.message);
      fakeStream(data.message, data.next_step_questions || []);
      break;

    case 'error':
      setCurrentEvent(chatId, null, '');
      initiateBotMessage(chatId, data.message);
      setBotErrorMessage(chatId, data.message);
      endBotMessage(chatId);
      break;

    case 'message_end':
    case 'workflow_end':
      setCurrentEvent(chatId, null, '');
      setBotThinking(chatId, false);
      break;
    default:
  }
};
