import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { GroupedModelSelector } from './model-selector';
import { ToolsSelector } from './tools-selector';
import { Tooltip, TooltipTrigger } from '@/components/ui-kit/tooltip';
import { useSidebar } from '@/components/ui-kit/sidebar';

interface GptChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const GptChatInput = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Ask me anything...',
}: GptChatInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { state } = useSidebar();

  const onMessageHandler = () => {
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-10 ${state === 'collapsed' ? 'ml-16' : 'ml-60'}`}
    >
      <div className="max-w-5xl mx-auto  pb-4 backdrop-blur-xl rounded-3xl">
        <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border hover:border-primary focus-within:border-primary transition-all duration-300 shadow-xl shadow-black/5">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onMessageHandler();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[80px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 px-6 py-5 text-base placeholder:text-muted-foreground/60"
          />

          <div className="absolute bottom-[75px] right-4">
            <Button
              size="icon"
              className={`h-10 w-10 rounded-2xl transition-all duration-300 ${
                message.trim() && !disabled
                  ? 'bg-primary hover:bg-primary/90 text-gray-200 shadow-lg shadow-primary/25 hover:scale-110'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              onClick={onMessageHandler}
              disabled={!message.trim() || disabled}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between px-6 pb-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <GroupedModelSelector value={selectedModel} onChange={setSelectedModel} />
                  </div>
                </TooltipTrigger>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ToolsSelector value={selectedTools} onChange={setSelectedTools} />
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
