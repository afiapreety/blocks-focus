import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import { Search, Paperclip, ArrowUp, Mic, Plus, Globe, FileImage, Video } from 'lucide-react';
import { useState } from 'react';
import { GroupedModelSelector } from './model-selector';

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

  const onMessageHandler = () => {
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="flex-shrink-0 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border hover:border-primary/30 focus-within:border-primary/50 transition-all duration-300 shadow-xl shadow-black/5">
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

          <div className="absolute bottom-[72px] right-4">
            <Button
              size="icon"
              className={`h-10 w-10 rounded-2xl transition-all duration-300 ${
                message.trim() && !disabled
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:scale-110'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              onClick={onMessageHandler}
              disabled={!message.trim() || disabled}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between px-6 pb-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <GroupedModelSelector value={selectedModel} onChange={setSelectedModel} />

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Globe className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <FileImage className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Video className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Mic className="h-4 w-4" />
              </Button>
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
