import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { conversationService } from '@/modules/gpt-chats/services/conversation.service';
import { parseSSEBuffer } from '@/modules/gpt-chats/utils/parse-sse';
import { SelectModelType } from '@/modules/gpt-chats/hooks/use-chat-store';
import { getRandomEventMessage } from '@/modules/gpt-chats/utils/chat-event-messages';
import { htmlToMarkdown } from '../utils/html-to-markdown';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  streaming?: boolean;
}

export interface ChatEvent {
  eventType: string;
  message: string;
}

interface UseNotesChatProps {
  noteContent?: string;
}

export function useNotesChat({ noteContent }: UseNotesChatProps = {}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ChatEvent | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const llmBasePrompt = import.meta.env.VITE_LLM_BASE_PROMPT;

  const sendMessage = async (userMessage: string, selectedModel: SelectModelType) => {
    if (!userMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty message',
        description: 'Please enter a message',
      });
      return;
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userMessage,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      // Parse model selection from SelectModelType object
      const modelId = selectedModel.isBlocksModels ? '' : selectedModel.model;
      const modelName = selectedModel.isBlocksModels ? selectedModel.model : '';
      const modelProvider = selectedModel.isBlocksModels ? selectedModel.provider : '';

      // Build context from note content if available
      let contextPrompt = userMessage;
      if (noteContent) {
        // Convert HTML content to markdown for better AI context
        const markdownContent = htmlToMarkdown(noteContent);
        contextPrompt = `Context: The user is working on a note with the following content:\n\n${markdownContent}\n\nUser question: ${userMessage}`;
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const reader = await conversationService.query({
        query: contextPrompt,
        session_id: sessionId,
        base_prompt: llmBasePrompt,
        model_id: modelId,
        model_name: modelName,
        model_provider: modelProvider,
        last_n_turn: 10,
        enable_summary: false,
        enable_next_suggestion: false,
        response_type: 'text',
        response_format: 'string',
        call_from: 'notes_chat',
      });

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let isDone = false;
      let receivedSessionId: string | undefined;

      while (!isDone) {
        const { done, value } = await reader.read();
        isDone = done;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSEBuffer(buffer);
          buffer = remaining;

          events.forEach((event) => {
            // Capture session ID
            if (event.eventData.session_id && !receivedSessionId) {
              receivedSessionId = String(event.eventData.session_id);
              setSessionId(receivedSessionId);
            }

            // Handle message content first
            if (event.eventType === 'chat_response' && event.eventData.message) {
              accumulatedContent = String(event.eventData.message);
              setCurrentEvent(null);
            } else if (event.eventType === 'message' && event.eventData.message) {
              if (!accumulatedContent) {
                accumulatedContent = String(event.eventData.message);
              } else {
                accumulatedContent += String(event.eventData.message);
              }
              setCurrentEvent(null);
            } else if (
              event.eventType &&
              event.eventType !== 'message' &&
              event.eventType !== 'chat_response' &&
              !accumulatedContent
            ) {
              // Only show event messages if we haven't started receiving content yet
              const eventMessage = getRandomEventMessage(event.eventType);
              setCurrentEvent({
                eventType: event.eventType,
                message: eventMessage,
              });
            }

            // Update assistant message with streaming content
            if (accumulatedContent) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedContent, streaming: true }
                    : msg
                )
              );
            }
          });
        }
      }

      // Mark message as complete (not streaming)
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, streaming: false } : msg))
      );
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentEvent(null);

      // Remove the placeholder assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));

      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: 'An error occurred while communicating with the AI',
      });
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentEvent(null);
    }
  };

  return {
    messages,
    isLoading,
    isStreaming,
    currentEvent,
    sendMessage,
    clearChat,
    stopGeneration,
  };
}
