import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { GroupedModelSelector } from './model-selector';
import { ToolsSelector } from './tools-selector';
import { Tooltip, TooltipTrigger } from '@/components/ui-kit/tooltip';
import { useSidebar } from '@/components/ui-kit/sidebar';
import { useTranslation } from 'react-i18next';
import { SelectModelType } from '../../hooks/use-chat-store';

interface GptChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel: SelectModelType;
  onModelChange: (model: SelectModelType) => void;
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  variant?: 'default' | 'chat-details';
}

export const GptChatInput = ({
  onSendMessage,
  disabled = false,
  placeholder,
  selectedModel,
  onModelChange,
  selectedTools,
  onToolsChange,
  variant = 'default',
}: GptChatInputProps) => {
  const [message, setMessage] = useState('');
  const { state } = useSidebar();
  const { t } = useTranslation();

  const onMessageHandler = () => {
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-10 transition-all duration-300 ${
        state === 'collapsed' ? 'md:ml-16' : 'md:ml-60'
      }`}
    >
      <div
        className={`w-full mx-auto rounded-3xl pb-4 border-x-0 ${
          variant === 'chat-details'
            ? 'max-w-3xl bg-background backdrop-blur-3xl'
            : 'max-w-3xl xl:max-w-5xl'
        }`}
      >
        <div className="bg-card relative rounded-3xl border-2 border-border hover:border-primary focus-within:border-primary transition-all duration-300 ">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onMessageHandler();
              }
            }}
            placeholder={placeholder || t('ASK_ME_ANYTHING')}
            disabled={disabled}
            className=" min-h-[80px] max-h-[200px] resize-none border-0  focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 px-6 py-5 pb-12 sm:pb-5 text-base placeholder:text-muted-foreground/60"
          />

          <div className="absolute  right-4 bottom-[75px] sm:right-4">
            <Button
              size="icon"
              className={`h-10 w-10 rounded-2xl transition-all duration-300 ${
                message.trim() && !disabled
                  ? 'bg-primary hover:bg-primary/90 text-gray-200  hover:scale-110'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              onClick={onMessageHandler}
              disabled={!message.trim() || disabled}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 pb-3 pt-2 border-t border-border/50 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <GroupedModelSelector value={selectedModel} onChange={onModelChange} />
                  </div>
                </TooltipTrigger>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ToolsSelector value={selectedTools} onChange={onToolsChange} />
                  </div>
                </TooltipTrigger>
              </Tooltip>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground/70 mt-3">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> to send,{' '}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};
