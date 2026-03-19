import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/modules/gpt-chats/hooks/use-chat-store';
import { useProcessFiles } from '@/modules/gpt-chats/hooks/use-agents';
import { GptChatInput } from '@/modules/gpt-chats/components/gpt-chat-input/gpt-chat-input';
import {
  ChatFileMetadata,
  ProcessFilesCallback,
  SelectModelType,
} from '../../types/chat-store.types';

export const GptChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectModel, setSelectedModel] = useState<SelectModelType>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
  });

  useEffect(() => {
    const navigationState = location.state as { selectedModel?: SelectModelType } | null;

    if (navigationState?.selectedModel) {
      setSelectedModel(navigationState.selectedModel);
      window.history.replaceState({}, document.title);
    } else if (location.pathname === '/chat' && !navigationState) {
      setSelectedModel({
        isBlocksModels: true,
        provider: 'azure',
        model: 'gpt-4o-mini',
      });
    }
  }, [location.state, location.pathname]);

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { startChat } = useChatStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { mutateAsync: processFilesMutation } = useProcessFiles();

  useEffect(() => {
    if (location.state?.selectedModel) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleSendMessage = (message: string, files?: ChatFileMetadata[]) => {
    if (message.trim()) {
      const processFilesCallback: ProcessFilesCallback = async (params) => {
        try {
          const result = await processFilesMutation(params);
          return result;
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      };

      startChat(
        message,
        selectModel,
        selectedTools,
        navigate,
        queryClient,
        files,
        processFilesCallback
      );
    }
  };
  const randomId = Math.floor(Math.random() * 10) + 1;
  const NEW_CHAT_PAGE_HEADER = t(`NEW_CHAT_PAGE_HEADER_${randomId}`);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-background to-muted/20 overflow-y-auto pb-[220px] sm:pb-[200px] md:pb-[180px]">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full py-4">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {NEW_CHAT_PAGE_HEADER}
          </h1>
        </div>
        <GptChatInput
          onSendMessage={handleSendMessage}
          selectedModel={selectModel}
          onModelChange={setSelectedModel}
          selectedTools={selectedTools}
          onToolsChange={setSelectedTools}
          className="static w-full max-w-4xl ml-0 md:ml-0 lg:ml-0 xl:ml-0"
        />
      </div>
    </div>
  );
};
