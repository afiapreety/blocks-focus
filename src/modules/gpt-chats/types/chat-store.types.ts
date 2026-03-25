export type ProcessFilesCallback = (params: {
  session_id: string;
  call_from: string;
  file_ids: string[];
}) => Promise<{ success: boolean; message?: string }>;

export type MessageType = 'user' | 'bot';

export interface ChatFileMetadata {
  fileId: string;
  fileName: string;
  fileUrl: string;
  extension: string;
  fileSize?: number;
}

export type SelectModelType = {
  isBlocksModels: boolean;
  provider: string;
  model: string;
  widget_id?: string;
};

export interface ChatMessage {
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
  files?: ChatFileMetadata[];
}

export interface ChatEvent {
  type: string;
  message: string;
}

export interface Chat {
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
  sessionFiles: ChatFileMetadata[];
}

export const chatDefaultValue: Chat = {
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

export interface SSEEvent {
  eventType: string;
  eventData: { session_id?: string; query?: string; message?: string };
}

export interface SSECallbackParams {
  event: SSEEvent;
  done: boolean;
}
