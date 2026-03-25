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

  if (normalizedType === 'task_progress' && data.task_action === 'generate_image') {
    const imageSkeletonContent = `:::image-skeleton\nGenerating image...\n:::`;

    // Resolve the actual chatId - if chat doesn't exist with given chatId, use activeChatId
    let state = useChatStore.getState();
    let actualChatId = chatId;
    if (!state.chats[chatId] && state.activeChatId) {
      actualChatId = state.activeChatId;
    }

    // If chat still doesn't exist, it might be a timing issue - refresh state
    if (!state.chats[actualChatId]) {
      state = useChatStore.getState();
    }

    setCurrentEvent(actualChatId, null, '');
    setBotThinking(actualChatId, true);

    const currentChat = state.chats[actualChatId];
    const lastConversation = currentChat?.conversations?.[currentChat.conversations.length - 1];

    if (!currentChat) {
      initiateBotMessage(actualChatId, '');
    }

    const skeletonAlreadyShown =
      lastConversation?.type === 'bot' && lastConversation?.message?.includes(':::image-skeleton');

    if (!skeletonAlreadyShown) {
      if (!currentChat?.conversations?.length || lastConversation?.type !== 'bot') {
        initiateBotMessage(actualChatId, imageSkeletonContent);
      } else {
        startBotMessage(actualChatId, imageSkeletonContent);
      }
    }

    return;
  }

  if (eventTypes.includes(normalizedType) || normalizedType.startsWith('node_start')) {
    const currentChat = useChatStore.getState().chats[chatId];
    const lastConversation = currentChat?.conversations?.[currentChat.conversations.length - 1];

    const hasImageSkeleton =
      lastConversation?.type === 'bot' && lastConversation?.message?.includes(':::image-skeleton');

    if (!hasImageSkeleton) {
      const eventMessage = getRandomEventMessage(data.type);
      setCurrentEvent(chatId, data.type, eventMessage);
      setBotThinking(chatId, true);
    } else {
      setCurrentEvent(chatId, null, '');
    }
    return;
  }

  const fakeStream = (
    fullMessage: string | object,
    next_step_questions: string[] = [],
    hasImages = false
  ) => {
    const chunkSize = 5;
    let index = 0;
    let timeoutId: NodeJS.Timeout;
    let messageToStream: string;
    let isJsonObject = false;

    const unwrapResultMessage = (value: unknown) => {
      if (!value || typeof value !== 'object') return null;

      const obj = value as Record<string, unknown>;
      const result = obj.result;

      if (typeof result === 'string') {
        return result;
      }

      if (result !== null && typeof result !== 'undefined') {
        return String(result);
      }

      return null;
    };

    if (typeof fullMessage === 'object' && fullMessage !== null) {
      const unwrapped = unwrapResultMessage(fullMessage);
      if (typeof unwrapped === 'string' && unwrapped.trim()) {
        isJsonObject = false;
        messageToStream = unwrapped;
      } else {
        isJsonObject = true;
        messageToStream = JSON.stringify(fullMessage);
      }
    } else if (typeof fullMessage === 'string') {
      try {
        const parsed = JSON.parse(fullMessage);
        const unwrapped = unwrapResultMessage(parsed);

        if (typeof unwrapped === 'string' && unwrapped.trim()) {
          isJsonObject = false;
          messageToStream = unwrapped;
        } else if (typeof parsed === 'object' && parsed !== null) {
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

    const imageBlockRegex = /:::image\n[\s\S]*?\n:::/g;
    if (imageBlockRegex.test(streamContent)) {
      streamBotMessage(chatId, streamContent);
      if (setSuggestions) setSuggestions(suggestions);
      endBotMessage(chatId);
      return;
    }

    if (isJsonObject && !hasImages) {
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
    case 'start': {
      setSessionId(chatId, data.session_id);
      break;
    }

    case 'typing': {
      break;
    }

    case 'message_start': {
      break;
    }

    case 'chat_response': {
      setCurrentEvent(chatId, null, '');

      const hasImages = data.images && Array.isArray(data.images) && data.images.length > 0;

      const state = useChatStore.getState();
      let actualChatId = chatId;
      if (!state.chats[chatId] && state.activeChatId) {
        actualChatId = state.activeChatId;
      }

      const currentChat = state.chats[actualChatId];
      const lastConversation = currentChat?.conversations?.[currentChat.conversations.length - 1];

      // Robust regex detection for skeleton, handling quotes, spaces, and different dashes
      const skeletonRegex = /:::image\s*[-–—]?\s*skeleton|image\s*[-–—]\s*skeleton/i;
      const hasImageSkeleton =
        lastConversation?.type === 'bot' &&
        lastConversation?.message &&
        (lastConversation.message.includes(':::image-skeleton') ||
          skeletonRegex.test(lastConversation.message));

      const hasExistingBotMessage =
        currentChat?.conversations?.length > 0 && lastConversation?.type === 'bot';

      // Early validation - if chat doesn't exist now, we can't proceed
      if (!currentChat) {
        console.error('[ERROR] Chat does not exist in store during chat_response', {
          chatId,
          actualChatId,
          availableChats: Object.keys(state.chats),
          activeChatId: state.activeChatId,
        });
        return;
      }

      let contentWithImages = data.message;

      if (hasImages) {
        contentWithImages = contentWithImages.replace(/!\[.*?\]\(.*?\)/g, '').trim();

        contentWithImages = contentWithImages
          .replace(/\[.*?\]\((https?:\/\/[^\s)]+)\)/g, '')
          .trim();

        const urlPattern = /(https?:\/\/[^\s]+)/g;
        contentWithImages = contentWithImages.replace(urlPattern, '').trim();

        contentWithImages = contentWithImages
          .replace(/Here's your image:?\s*/gi, "Here's your ")
          .trim();
        contentWithImages = contentWithImages.replace(/\bImage link:?\s*/gi, '').trim();
        contentWithImages = contentWithImages.replace(/^Image:?\s*/gim, '').trim();

        contentWithImages = contentWithImages.replace(/\n\s*\n/g, '\n').trim();

        data.images.forEach((img: any, index: number) => {
          const separator = contentWithImages ? '\n\n' : '';
          if (img.base64) {
            const imageMarkdown = `![Generated Image ${index + 1}](data:image/${img.format || 'png'};base64,${img.base64})`;
            contentWithImages += `${separator}:::image\n${imageMarkdown}\n:::`;
          } else if (img.url || img.image_url) {
            const imageUrl = img.url || img.image_url;
            const imageMarkdown = `![Generated Image ${index + 1}](${imageUrl})`;
            contentWithImages += `${separator}:::image\n${imageMarkdown}\n:::`;
          }
        });

        const displayImage = () => {
          // Get the current active chat ID in case migration happened
          const currentState = useChatStore.getState();
          const currentChatId = currentState.activeChatId || actualChatId;
          const currentChatExists = !!currentState.chats[currentChatId];

          if (!currentChatExists) {
            console.error('[ERROR] Chat does not exist after migration check', {
              currentChatId,
              availableChats: Object.keys(currentState.chats),
            });
            return;
          }

          // Always replace the skeleton if it exists
          if (hasImageSkeleton) {
            startBotMessage(currentChatId, contentWithImages);

            // Delay endBotMessage to ensure state update is processed
            setTimeout(() => {
              if (setSuggestions) setSuggestions(data.next_step_questions || []);
              endBotMessage(currentChatId);
            }, 50);
          } else if (!hasExistingBotMessage) {
            initiateBotMessage(currentChatId, contentWithImages);
            if (setSuggestions) setSuggestions(data.next_step_questions || []);
            endBotMessage(currentChatId);
          } else {
            startBotMessage(currentChatId, contentWithImages);
            if (setSuggestions) setSuggestions(data.next_step_questions || []);
            endBotMessage(currentChatId);
          }
        };

        if (hasImageSkeleton) {
          setTimeout(displayImage, 300);
        } else {
          displayImage();
        }
      } else {
        // Handle images embedded in text (markdown links or naked URLs)

        // 1. Convert Markdown Links that point to images: [Alt](url.png) -> :::image\n![Alt](url.png)\n:::
        const markdownLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi;

        contentWithImages = contentWithImages.replace(
          markdownLinkRegex,
          (match: string, alt: string, url: string) => {
            // Check if the URL looks like an image (extension or common image parameters if any)
            if (/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(url)) {
              const imageMarkdown = `![${alt}](${url})`;
              return `\n\n:::image\n${imageMarkdown}\n:::`;
            }
            return match; // Keep as a link if not an image
          }
        );

        // 2. Convert naked URLs that look like images: https://.../image.png -> :::image\n![Image](url)\n:::
        const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)[^\s]*)/gi;

        contentWithImages = contentWithImages.replace(
          urlRegex,
          (match: string, url: string, offset: number, string: string) => {
            // Check context: if this URL is inside a markdown link/image (preceded by '(' or ']('), skip it.
            const precedingChar = string[offset - 1];
            const precedingTwoChars = string.slice(offset - 2, offset);

            if (
              precedingChar === '(' ||
              precedingTwoChars === '](' ||
              precedingChar === '"' ||
              precedingChar === "'"
            ) {
              return match;
            }

            const imageMarkdown = `![Image](${url})`;
            return `\n\n:::image\n${imageMarkdown}\n:::`;
          }
        );

        // Get the current active chat ID in case migration happened
        const currentState = useChatStore.getState();
        const currentChatId = currentState.activeChatId || actualChatId;

        // If we have a skeleton, we MUST replace it, regardless of whether we stream or not
        if (hasImageSkeleton) {
          startBotMessage(currentChatId, contentWithImages);
          if (setSuggestions) setSuggestions(data.next_step_questions || []);
          endBotMessage(currentChatId);
        } else {
          if (!hasExistingBotMessage) {
            initiateBotMessage(currentChatId, '');
          }
          fakeStream(contentWithImages, data.next_step_questions || [], false);
        }
      }
      break;
    }

    case 'message_end':
    case 'workflow_end': {
      setCurrentEvent(chatId, null, '');
      setBotThinking(chatId, false);
      break;
    }

    default:
      break;
  }
};
