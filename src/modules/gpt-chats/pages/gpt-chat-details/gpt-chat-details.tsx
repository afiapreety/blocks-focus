import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { Clipboard, Check, Zap, FileText, ArrowDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';
import { cn } from '@/lib/utils';
import { useChatSSE } from '../../hooks/use-chat-sse';
import DummyProfile from '@/assets/images/dummy_profile.png';
import botLogoSELISEAI from '@/assets/images/selise_ai_small.png';
import { useGetAccount } from '@/modules/profile/hooks/use-account';
import { ChatFileMetadata } from '../../types/chat-store.types';
import { formatFileSize } from '../../utils/format-file-size';
import { useGetLlmModels } from '../../hooks/use-gpt-chat';
import { GptChatInput } from '../../components/gpt-chat-input/gpt-chat-input';
import { ChatEventMessage, SparkleText } from '../../utils/chat-event-messages';
import { handleCopyRaw, handleCopyWithStyling } from '../../utils/copy-chats';
import { MarkdownRenderer } from '../../components/markdown-renderer/markdown-renderer';

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef<boolean>(false);
  const userHasManuallyScrolledRef = useRef<boolean>(false);
  const { data } = useGetAccount();
  const { data: llmModels } = useGetLlmModels();
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
    userHasManuallyScrolledRef.current = false;
  }, [chatId]);

  // Detect user manual scrolling with wheel event
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check container scroll first
      if (container.scrollHeight > container.clientHeight) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;

        // If user is scrolling down (deltaY > 0) and already at bottom, don't set flag
        if (e.deltaY > 0 && distanceFromBottom < 10) return;

        // If user is scrolling up or away from bottom, set flag
        if (e.deltaY !== 0) {
          userHasManuallyScrolledRef.current = true;
        }
        return;
      }

      // Fallback to window scroll detection
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      if (docHeight > winHeight) {
        const distanceFromBottom = docHeight - scrollY - winHeight;

        // If user is scrolling down (deltaY > 0) and already at bottom, don't set flag
        if (e.deltaY > 0 && distanceFromBottom < 10) return;

        // If user is scrolling up or away from bottom, set flag
        if (e.deltaY !== 0) {
          userHasManuallyScrolledRef.current = true;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Detect scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = scrollContainerRef.current;

    const checkScroll = () => {
      // Check container scroll first
      if (container && container.scrollHeight > container.clientHeight) {
        const { scrollHeight, scrollTop, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const shouldShow = distanceFromBottom > 50;
        setShowScrollButton(shouldShow);
        return;
      }

      // Fallback to window scroll
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isScrollable = scrollHeight > clientHeight;

      const shouldShow = isScrollable && distanceFromBottom > 50;
      setShowScrollButton(shouldShow);
    };

    const handleScroll = () => {
      requestAnimationFrame(checkScroll);
    };

    // Add listeners to both container and window to cover all scroll scenarios
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    const initialTimeout = setTimeout(checkScroll, 300);

    // Check on resize
    window.addEventListener('resize', handleScroll);

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(initialTimeout);
    };
  }, [conversations.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (!isReady || conversations.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // If user has manually scrolled during streaming, don't auto-scroll
    if (userHasManuallyScrolledRef.current && isBotStreaming) {
      return;
    }

    // Check if user is currently at bottom - if so, clear manual scroll flag
    let distanceFromBottom = 0;

    if (container.scrollHeight > container.clientHeight) {
      distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    } else {
      // Check window scroll if container is not scrollable
      distanceFromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY || document.documentElement.scrollTop) -
        window.innerHeight;
    }

    if (distanceFromBottom < 20) {
      userHasManuallyScrolledRef.current = false;
    }

    const shouldSmoothScroll = distanceFromBottom > 100;
    const behavior = isBotStreaming
      ? shouldSmoothScroll
        ? 'smooth'
        : 'auto'
      : hasScrolledToBottomRef.current
        ? 'smooth'
        : 'auto';
    const delay = isBotStreaming ? 10 : hasScrolledToBottomRef.current ? 100 : 0;

    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: behavior });
      hasScrolledToBottomRef.current = true;
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [conversations, isBotStreaming, isReady]);

  const handleSendMessage = (message: string, files?: ChatFileMetadata[]) => {
    if (!message.trim()) return;
    userHasManuallyScrolledRef.current = false;
    sendMessage({ message, files });
  };

  const scrollToBottom = () => {
    userHasManuallyScrolledRef.current = false;

    const container = scrollContainerRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const getModelLabel = (modelName?: string) => {
    if (!modelName) return null;
    const model = llmModels?.find((m) => m.model_name === modelName);
    return model?.model_name_label || modelName;
  };

  const renderMessageContent = (content: string, isStreaming = false, messageId?: number) => {
    return (
      <div className="w-full min-w-0 relative" data-message-id={messageId}>
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {isReady && (
          <div className="w-full px-4 md:px-6 lg:px-8 py-4 pb-8 space-y-10">
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
                  className={`group flex-1 min-w-0 relative ${msg.type === 'user' ? 'flex flex-col items-end gap-2' : ''} ${msg.type === 'bot' ? 'flex flex-col gap-1' : ''}`}
                >
                  {msg.type === 'bot' && (msg.tokenUsage?.model_name || selectedModel?.model) && (
                    <span className="text-muted-foreground font-medium">
                      {getModelLabel(msg.tokenUsage?.model_name || selectedModel?.model)}
                    </span>
                  )}

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
                    className={`${msg.type === 'bot' ? 'min-w-0' : 'max-w-[90%] md:max-w-[80%] min-w-0'} py-1 ${msg.type === 'user' && 'bg-accent rounded-xl px-5'}`}
                  >
                    {msg.type === 'user' ? (
                      <p className="text-[15px] leading-7 whitespace-pre-wrap">{msg.message}</p>
                    ) : (
                      renderMessageContent(msg.message, msg.streaming && isBotStreaming, index)
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

                      {msg.type === 'bot' ? (
                        <DropdownMenu>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-muted"
                                  >
                                    {copiedId === index ? (
                                      <Check className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                      <Clipboard className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300">
                                <p>{copiedId === index ? 'Copied' : 'Copy'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                handleCopyWithStyling(index, { setCopiedId, conversations })
                              }
                            >
                              <Clipboard className="h-4 w-4 mr-2" />
                              Copy with styling
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyRaw(msg.message, index, { setCopiedId })}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Copy raw response
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-muted"
                                onClick={() => handleCopyRaw(msg.message, index, { setCopiedId })}
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
                      )}

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

      {showScrollButton && (
        <div className="flex justify-center w-full">
          <div className="fixed bottom-[208px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shadow-xl bg-background hover:bg-accent border border-border backdrop-blur-sm"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
