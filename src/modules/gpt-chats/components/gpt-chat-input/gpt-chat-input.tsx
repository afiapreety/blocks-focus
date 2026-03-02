import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import { ArrowUp, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { GroupedModelSelector } from './model-selector';
import { ToolsSelector } from './tools-selector';
import { MoreMenu } from './more-menu';
import { Tooltip, TooltipTrigger } from '@/components/ui-kit/tooltip';
import { useSidebar } from '@/components/ui-kit/sidebar';
import { useTranslation } from 'react-i18next';
import { SelectModelType } from '../../hooks/use-chat-store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GptChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel: SelectModelType;
  onModelChange: (model: SelectModelType) => void;
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  className?: string;
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
  className,

  variant = 'default',
}: GptChatInputProps) => {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { toast } = useToast();
  const isAgentChat = selectedModel?.provider === 'agents';

  const handleUploadFiles = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    toast({
      title: 'Files Uploaded',
      description: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onMessageHandler = () => {
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-10',
        state === 'collapsed' ? 'md:ml-16 lg:ml-16 xl:ml-16' : 'md:ml-64 lg:ml-64 xl:ml-60',
        className
      )}
    >
      <div
        className={`w-full mx-auto px-4  pb-4  max-w-4xl xl:max-w-5xl ${
          variant === 'chat-details' ? ' bg-background backdrop-blur-3xl' : ''
        }`}
      >
        <div className="bg-card relative rounded-3xl border-2 border-border hover:border-primary focus-within:border-primary">
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate max-w-[150px]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            className={cn(
              'min-h-[80px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 px-6 pb-12 sm:pb-5 text-base placeholder:text-muted-foreground/60',
              uploadedFiles.length > 0 ? 'pt-2' : 'py-5'
            )}
          />

          <div className="absolute  right-4 bottom-[75px] sm:right-4">
            <Button
              size="icon"
              className={`h-10 w-10 rounded-2xl ${
                message.trim() && !disabled
                  ? 'bg-primary hover:bg-primary/90 text-white  hover:scale-110'
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
              <MoreMenu onUploadFiles={handleUploadFiles} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <GroupedModelSelector
                      value={selectedModel}
                      onChange={onModelChange}
                      locked={isAgentChat}
                      isAgentChat={isAgentChat}
                    />
                  </div>
                </TooltipTrigger>
              </Tooltip>

              {!isAgentChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ToolsSelector value={selectedTools} onChange={onToolsChange} />
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              )}
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
