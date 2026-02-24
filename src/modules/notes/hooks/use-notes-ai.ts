import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SelectModelType } from '@/modules/gpt-chats/hooks/use-chat-store';
import { conversationService } from '@/modules/gpt-chats/services/conversation.service';
import { parseSSEBuffer } from '@/modules/gpt-chats/utils/parse-sse';
import { markdownToHtml } from '../utils/markdown-to-html';

interface UseNoteAIEnhancementProps {
  content: string;
  setContent: (content: string) => void;
  getPlainText?: (html: string) => string;
  quillInstance?: any;
}

export function useNoteAIEnhancement({
  content,
  setContent,
  getPlainText,
  quillInstance,
}: UseNoteAIEnhancementProps) {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const llmBasePrompt = import.meta.env.VITE_LLM_BASE_PROMPT;

  const fakeStreamNoteContent = (fullMessage: string, onComplete: (content: string) => void) => {
    const isHtmlContent = fullMessage.includes('<');
    const chunkSize = isHtmlContent ? 80 : 5;
    const delay = isHtmlContent ? 25 : 20;

    let index = 0;
    let accumulatedContent = '';

    const sendNextChunk = () => {
      if (index >= fullMessage.length) {
        onComplete(accumulatedContent);
        return;
      }

      let chunk = fullMessage.slice(index, index + chunkSize);

      // For HTML: try to break at tag boundaries to maintain valid HTML
      if (isHtmlContent && chunk.length === chunkSize && index + chunkSize < fullMessage.length) {
        // Look for the nearest closing tag or opening tag
        const closeTagIndex = chunk.lastIndexOf('>');
        if (closeTagIndex !== -1) {
          chunk = chunk.slice(0, closeTagIndex + 1);
        }
      }

      accumulatedContent += chunk;

      // Use Quill API directly if available to preserve undo/redo history
      if (quillInstance) {
        const delta = quillInstance.clipboard.convert({ html: accumulatedContent });
        quillInstance.setContents(delta, 'user');
      } else {
        setContent(accumulatedContent);
      }

      index += chunk.length;
      setTimeout(sendNextChunk, delay);
    };

    sendNextChunk();
  };

  const handleEnhanceWithAI = async (selectedModel: SelectModelType | undefined) => {
    if (!content.trim() || content === '<p><br></p>') {
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

      const plainTextContent = getPlainText ? getPlainText(content) : content;
      //   const enhancePrompt = `Enhance existing notes using additional context provided  content in the content's primary language. Your task is to make the notes more useful and comprehensive by incorporating relevant information from the provided context.:\n\n${plainTextContent}`;

      const enhancePrompt = `Enhance existing notes using additional context. Your task is to make the notes more useful and comprehensive by incorporating relevant information from the provided context according to the base prompt.:\n\n${plainTextContent}`;

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
        if (getPlainText) {
          const htmlContent = markdownToHtml(enhancedContent);
          fakeStreamNoteContent(htmlContent, () => {
            setIsEnhancing(false);
            toast({
              variant: 'success',
              title: 'Content enhanced',
              description: 'Your note has been enhanced with AI',
            });
          });
        } else {
          setContent(enhancedContent);
          setIsEnhancing(false);
          toast({
            variant: 'success',
            title: 'Content enhanced',
            description: 'Your note has been enhanced with AI',
          });
        }
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
