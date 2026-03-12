import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { Clipboard, Check, Zap, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import { cn } from '@/lib/utils';
import { GptChatInput } from '../../components/gpt-chat-input/gpt-chat-input';
import { useChatSSE } from '../../hooks/use-chat-sse';
import { MarkdownRenderer } from '../../components/markdown-renderer/markdown-renderer';
import { ChatEventMessage, SparkleText } from '../../utils/chat-event-messages';
import DummyProfile from '@/assets/images/dummy_profile.png';
import { useGetAccount } from '@/modules/profile/hooks/use-account';
import botLogoSELISEAI from '@/assets/images/selise_ai_small.png';
import { ChatFileMetadata } from '../../types/chat-store.types';
import { formatFileSize } from '../../utils/format-file-size';

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getFullTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const ThinkingIndicator = () => (
  <div className="flex gap-4 items-start ml-1 min-h-[48px] duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <img src={botLogoSELISEAI} alt="bot" className="h-5 w-5" />
    </div>
    <div className="flex-1 py-1">
      <div className="flex items-center gap-2">
        {/* <span className="text-foreground/60 text-sm italic">Sending</span> */}
        <SparkleText text={'Sending'} />

        {/* <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div> */}
      </div>
    </div>
  </div>
);

const ChatEventMessageIndicator = ({ message }: { message: string }) => (
  <div className="flex gap-4 items-start ml-1 min-h-[48px] duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <img src={botLogoSELISEAI} alt="bot" className="h-5 w-5" />
    </div>
    <div className="flex-1 py-1">
      <ChatEventMessage message={message} />
    </div>
  </div>
);

export const GptChatPageDetails = () => {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agent');
  const widgetId = searchParams.get('widget');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef<boolean>(false);
  const { data } = useGetAccount();
  const {
    sendMessage,
    conversations,
    isBotStreaming,
    isBotThinking,
    isReady,
    selectedModel,
    onModelChange,

    selectedTools,
    onToolsChange,
    currentEvent,
  } = useChatSSE({
    chatId,
    agentId,
    widgetId,
  });

  useEffect(() => {
    hasScrolledToBottomRef.current = false;
  }, [chatId]);

  // Scroll to bottom when conversations load or update
  useEffect(() => {
    if (!isReady || conversations.length === 0) return;

    const behavior = isBotStreaming ? 'auto' : hasScrolledToBottomRef.current ? 'smooth' : 'auto';
    const delay = isBotStreaming ? 10 : hasScrolledToBottomRef.current ? 100 : 0;

    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
      hasScrolledToBottomRef.current = true;
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [conversations, isBotStreaming, isReady]);

  const handleSendMessage = (message: string, files?: ChatFileMetadata[]) => {
    if (!message.trim()) return;
    sendMessage({ message, files });
  };

  const handleCopy = (content: string, messageId: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (content: string, isStreaming = false) => {
    return (
      <div className="w-full min-w-0 relative">
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
        {isStreaming && (
          <>
            <span
              className="absolute w-[2px] h-[1.2em] bg-primary ml-[2px]"
              style={{
                bottom: '0.2em',
                right: '-4px',
                animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />

            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                style={{
                  bottom: '0.5em',
                  right: '-4px',
                  animation: `splash${i} 1.5s ease-out infinite`,
                  opacity: 0,
                }}
              />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isReady && (
          <div className="w-full px-4 md:px-6 lg:px-8 py-4 pb-16 space-y-10">
            {conversations.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'bot' ? 'items-start ml-1' : ''} ${msg.type === 'bot' && !msg.streaming ? 'animate-in fade-in duration-700 ease-in-out' : ''}`}
              >
                {msg.type === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <img src={botLogoSELISEAI} alt="bot" className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`group flex-1 min-w-0 relative ${msg.type === 'user' ? 'flex flex-col items-end gap-2' : ''} ${msg.type === 'bot' ? 'min-h-[48px]' : ''}`}
                >
                  {msg.type === 'user' && msg.files && msg.files.length > 0 && (
                    <div className="flex flex-col gap-2 max-w-[70%] md:max-w-[90%]">
                      {msg.files.map((file, fileIndex) => {
                        return (
                          <div
                            key={fileIndex}
                            className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-3 bg-muted/90 rounded-lg text-sm w-full"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate font-medium flex-1" title={file.fileName}>
                              {file.fileName}
                            </span>
                            {file.fileSize && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatFileSize(file.fileSize)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] md:max-w-[80%] min-w-0 py-1 ${msg.type === 'user' && 'bg-accent rounded-xl px-5'}`}
                  >
                    {msg.type === 'user' ? (
                      <p className="text-[15px] leading-7 whitespace-pre-wrap">{msg.message}</p>
                    ) : (
                      renderMessageContent(msg.message, msg.streaming && isBotStreaming)
                    )}
                  </div>

                  {!msg.streaming && (
                    <div
                      className={cn(
                        'absolute -bottom-8 flex items-center gap-1.5',
                        msg.type === 'user' ? 'right-0' : 'left-0'
                      )}
                    >
                      {msg.timestamp && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-gray-400 cursor-default px-1">
                                {formatTimestamp(msg.timestamp)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300">
                              <p>{getFullTimestamp(msg.timestamp)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-muted"
                              onClick={() => handleCopy(msg.message, index)}
                            >
                              {copiedId === index ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Clipboard className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300">
                            <p>{copiedId === index ? 'Copied' : 'Copy'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {msg.type === 'bot' && msg.metadata?.tool_calls_made !== undefined && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ',
                                  msg.metadata.tool_calls_made > 0
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'hover:bg-muted'
                                )}
                              >
                                <Zap className="h-3.5 w-3.5" />
                                <span>{msg.metadata.tool_calls_made}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300">
                              <p>
                                {msg.metadata.tool_calls_made === 0
                                  ? 'No tools used'
                                  : `${msg.metadata.tool_calls_made} tool ${msg.metadata.tool_calls_made === 1 ? 'call' : 'calls'} made`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>

                {msg.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden">
                    <img
                      src={
                        data?.profileImageUrl !== ''
                          ? (data?.profileImageUrl ?? DummyProfile)
                          : DummyProfile
                      }
                      alt="profile"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}

            {isBotThinking &&
              (() => {
                const lastConversation = conversations[conversations.length - 1];
                const hasImageSkeleton =
                  lastConversation?.type === 'bot' &&
                  lastConversation?.message?.includes(':::image-skeleton');

                if (hasImageSkeleton) return null;

                return (
                  <div
                    key="thinking-indicator"
                    className="animate-in fade-in duration-700 ease-in-out"
                  >
                    {currentEvent ? (
                      <ChatEventMessageIndicator message={currentEvent.message} />
                    ) : (
                      <ThinkingIndicator />
                    )}
                  </div>
                );
              })()}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <GptChatInput
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        selectedTools={selectedTools}
        onToolsChange={onToolsChange}
        variant="chat-details"
      />
    </div>
  );
};
