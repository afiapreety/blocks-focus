export const logError = (context: string, error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[Chat Error - ${context}]:`, errorMessage, error);
};

export const createErrorMessage = (message: string): string => `⚠️ ${message}`;

export const createFileProcessingErrorMessage = (errorMessage?: string): string =>
  createErrorMessage(
    `File processing failed: ${errorMessage}. The AI may not be able to access the file content.`
  );

export const handleSSEParseError = (error: unknown): void => {
  // SSE parse errors are expected for incomplete data chunks, safe to ignore
  if (process.env.NODE_ENV === 'development') {
    logError('SSE Parse', error);
  }
};

export const handleFileProcessingError = (
  chatId: string,
  error: unknown,
  setState: (updater: (state: any) => any) => void
): void => {
  logError('File Processing', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

  setState((state) => ({
    chats: {
      ...state.chats,
      [chatId]: {
        ...state.chats[chatId],
        conversations: [
          ...state.chats[chatId].conversations,
          {
            message: `⚠️ File processing failed: ${errorMessage}. Please try uploading the files again.`,
            type: 'bot',
            streaming: false,
            timestamp: new Date().toISOString(),
          },
        ],
        isBotThinking: false,
      },
    },
  }));
};

export const handleSessionSetupError = (
  chatId: string,
  error: unknown,
  setState: (updater: (state: any) => any) => void
): void => {
  logError('Session Setup', error);

  setState((state) => ({
    chats: {
      ...state.chats,
      [chatId]: {
        ...state.chats[chatId],
        conversations: [
          ...state.chats[chatId].conversations,
          {
            message: '⚠️ Failed to initialize chat session. Please try again.',
            type: 'bot',
            streaming: false,
            timestamp: new Date().toISOString(),
          },
        ],
        isBotThinking: false,
      },
    },
  }));
};

export const handleStreamError = (
  chatId: string,
  setState: (updater: (state: any) => any) => void
): void => {
  setState((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;

    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          isBotThinking: false,
          currentEvent: null,
        },
      },
    };
  });
};
