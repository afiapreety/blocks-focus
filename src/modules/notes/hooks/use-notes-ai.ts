import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SelectModelType } from '@/modules/gpt-chats/hooks/use-chat-store';
import { conversationService } from '@/modules/gpt-chats/services/conversation.service';
import { parseSSEBuffer } from '@/modules/gpt-chats/utils/parse-sse';
import { markdownToHtml } from '../utils/markdown-to-html';
import { htmlToMarkdown } from '../utils/html-to-markdown';

interface UseNoteAIEnhancementProps {
  content: string;
  setContent: (content: string) => void;
  isMarkdownMode?: boolean;
}

export function useNoteAIEnhancement({
  content,
  setContent,
  isMarkdownMode = true,
}: UseNoteAIEnhancementProps) {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const llmBasePrompt = import.meta.env.VITE_LLM_BASE_PROMPT;

  const fakeStreamNoteContent = (fullMessage: string, onComplete: (content: string) => void) => {
    const chunkSize = 10;
    const delay = 20;

    let index = 0;
    let accumulatedContent = '';

    const sendNextChunk = () => {
      if (index >= fullMessage.length) {
        onComplete(accumulatedContent);
        return;
      }

      const chunk = fullMessage.slice(index, index + chunkSize);
      accumulatedContent += chunk;
      setContent(accumulatedContent);

      index += chunk.length;
      setTimeout(sendNextChunk, delay);
    };

    sendNextChunk();
  };

  const handleEnhanceWithAI = async (selectedModel: SelectModelType | undefined) => {
    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'No content',
        description: 'Please write some content first to enhance',
      });
      return;
    }

    if (!selectedModel) {
      toast({
        variant: 'destructive',
        title: 'No model selected',
        description: 'Please select an AI model from settings',
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const modelId = selectedModel.isBlocksModels ? '' : selectedModel.model;
      const modelName = selectedModel.isBlocksModels ? selectedModel.model : '';
      const modelProvider = selectedModel.isBlocksModels ? selectedModel.provider : '';

      // Convert HTML content to markdown for AI processing
      const markdownContent = isMarkdownMode ? htmlToMarkdown(content) : content;

      const enhancePrompt = isMarkdownMode
        ? `Enhance the following markdown notes. Make them more useful and comprehensive by incorporating relevant information. Return the enhanced content in markdown format:\n\n${markdownContent}`
        : `Enhance existing notes using additional context. Your task is to make the notes more useful and comprehensive by incorporating relevant information from the provided context according to the base prompt.:\n\n${markdownContent}`;

      const reader = await conversationService.query({
        query: enhancePrompt,
        session_id: undefined,
        base_prompt: llmBasePrompt,
        model_id: modelId,
        model_name: modelName,
        model_provider: modelProvider,
        tool_ids: undefined,
        last_n_turn: 5,
        enable_summary: false,
        enable_next_suggestion: false,
        response_type: 'text',
        response_format: 'string',
        call_from: 'notes_ai_enhancement',
      });

      const decoder = new TextDecoder();
      let buffer = '';
      let enhancedContent = '';
      let isDone = false;
      let hasReceivedResponse = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        isDone = done;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSEBuffer(buffer);
          buffer = remaining;

          events.forEach((event) => {
            if (event.eventType === 'chat_response' && event.eventData.message) {
              hasReceivedResponse = true;
              enhancedContent = String(event.eventData.message);
            } else if (event.eventType === 'message' && event.eventData.message) {
              hasReceivedResponse = true;
              if (!enhancedContent) {
                enhancedContent = String(event.eventData.message);
              } else {
                enhancedContent += String(event.eventData.message);
              }
            }
          });
        }
      }

      if (hasReceivedResponse && enhancedContent.trim()) {
        // Convert markdown response to HTML for BlockEditor
        const htmlContent = isMarkdownMode ? markdownToHtml(enhancedContent) : enhancedContent;
        fakeStreamNoteContent(htmlContent, () => {
          setIsEnhancing(false);
          toast({
            variant: 'success',
            title: 'Content enhanced',
            description: 'Your note has been enhanced with AI',
          });
        });
      } else {
        setIsEnhancing(false);
        toast({
          variant: 'destructive',
          title: 'No response',
          description: 'AI did not return any content',
        });
      }
    } catch (error) {
      console.error('Error enhancing content:', error);
      setIsEnhancing(false);
      toast({
        variant: 'destructive',
        title: 'Enhancement failed',
        description: 'Failed to enhance content with AI',
      });
    }
  };

  return {
    isEnhancing,
    handleEnhanceWithAI,
  };
}
