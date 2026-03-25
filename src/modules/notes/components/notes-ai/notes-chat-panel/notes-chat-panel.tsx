import { useState, useRef, useEffect } from 'react';
import { Mic, ArrowUp, ArrowDown, Trash2, Clipboard, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import { cn } from '@/lib/utils';
import { useNotesChat } from '../../../hooks/use-notes-chat';
import { GroupedModelSelector } from '@/modules/gpt-chats/components/gpt-chat-input/model-selector';
import { SelectModelType } from '@/modules/gpt-chats/types/chat-store.types';
import { MarkdownRenderer } from '@/modules/gpt-chats/components/markdown-renderer/markdown-renderer';
import { ChatEventMessage, SparkleText } from '@/modules/gpt-chats/utils/chat-event-messages';
import botLogoSELISEAI from '@/assets/images/selise_ai_small.png';
import { useGetAccount } from '@/modules/profile/hooks/use-account';
import DummyProfile from '@/assets/images/dummy_profile.png';
import { useGetLlmModels } from '@/modules/gpt-chats/hooks/use-gpt-chat';

interface NotesChatPanelProps {
  noteContent?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotesChatPanel({ noteContent, isOpen, onClose }: NotesChatPanelProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<SelectModelType>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef<boolean>(false);
  const userHasManuallyScrolledRef = useRef<boolean>(false);
  const { data: accountData } = useGetAccount();
  const { data: llmModels } = useGetLlmModels();

  const { messages, isLoading, isStreaming, currentEvent, sendMessage, clearChat } = useNotesChat({
    noteContent,
  });

  // Detect user manual scrolling with wheel event
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (container.scrollHeight > container.clientHeight) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;

        if (e.deltaY > 0 && distanceFromBottom < 10) return;

        if (e.deltaY !== 0) {
          userHasManuallyScrolledRef.current = true;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Detect scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = scrollContainerRef.current;

    const checkScroll = () => {
      if (container && container.scrollHeight > container.clientHeight) {
        const { scrollHeight, scrollTop, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const shouldShow = distanceFromBottom > 50;
        setShowScrollButton(shouldShow);
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(checkScroll);
    };

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    const initialTimeout = setTimeout(checkScroll, 300);

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(initialTimeout);
    };
  }, [messages.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (messages.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // If user has manually scrolled during streaming, don't auto-scroll
    if (userHasManuallyScrolledRef.current && isStreaming) {
      return;
    }

    // Check if user is currently at bottom - if so, clear manual scroll flag
    let distanceFromBottom = 0;

    if (container.scrollHeight > container.clientHeight) {
      distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    }

    if (distanceFromBottom < 20) {
      userHasManuallyScrolledRef.current = false;
    }

    const shouldSmoothScroll = distanceFromBottom > 100;
    const behavior = isStreaming
      ? shouldSmoothScroll
        ? 'smooth'
        : 'auto'
      : hasScrolledToBottomRef.current
        ? 'smooth'
        : 'auto';
    const delay = isStreaming ? 10 : hasScrolledToBottomRef.current ? 100 : 0;

    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: behavior });
      hasScrolledToBottomRef.current = true;
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = message;
      setMessage('');
      userHasManuallyScrolledRef.current = false;
      await sendMessage(userMessage, selectedModel);
    }
  };

  const scrollToBottom = () => {
    userHasManuallyScrolledRef.current = false;

    const container = scrollContainerRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getModelLabel = (modelName?: string) => {
    if (!modelName) return null;
    const model = llmModels?.find((m) => m.model_name === modelName);
    return model?.model_name_label || modelName;
  };

  const handleClearChat = () => {
    clearChat();
  };

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (timestamp: Date) => {
    return format(timestamp, 'HH:mm');
  };

  const getFullTimestamp = (timestamp: Date) => {
    return format(timestamp, 'MMM d, yyyy h:mm a');
  };

  const renderMessageContent = (content: string) => {
    return (
      <div className="text-[15px]">
        <MarkdownRenderer content={content} />
      </div>
    );
  };

  const ThinkingIndicator = () => (
    <div className="flex gap-3 items-start min-h-[48px] duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <img src={botLogoSELISEAI} alt="bot" className="h-4 w-4" />
      </div>
      <div className="flex-1 py-1">
        <SparkleText text="Sending" />
      </div>
    </div>
  );

  const ChatEventMessageIndicator = ({ message: eventMessage }: { message: string }) => (
    <div className="flex gap-3 items-start min-h-[48px] duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <img src={botLogoSELISEAI} alt="bot" className="h-4 w-4" />
      </div>
      <div className="flex-1 py-1">
        <ChatEventMessage message={eventMessage} />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full border-l border-border bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-base font-semibold">Chat with AI</h2>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-background p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Start a conversation about your note</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages
              .filter((msg) => msg.role === 'user' || msg.content.trim() !== '')
              .map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start items-start',
                    msg.role === 'assistant' && !msg.streaming
                      ? 'animate-in fade-in duration-700 ease-in-out'
                      : ''
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <img src={botLogoSELISEAI} alt="bot" className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'group flex-1 relative',
                      msg.role === 'user' ? 'flex justify-end' : '',
                      msg.role === 'assistant' ? 'min-h-[32px] flex flex-col gap-1' : ''
                    )}
                  >
                    {msg.role === 'assistant' && msg.modelName && (
                      <span className="text-muted-foreground font-medium">
                        {getModelLabel(msg.modelName)}
                      </span>
                    )}

                    <div
                      className={cn(
                        'max-w-[90%] py-1',
                        msg.role === 'user' && 'bg-accent rounded-xl px-4 py-2'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-[15px] leading-7 whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>

                    {!msg.streaming && (
                      <div
                        className={cn(
                          'absolute -bottom-6 flex items-center gap-1.5',
                          msg.role === 'user' ? 'right-0' : 'left-0'
                        )}
                      >
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground cursor-default px-1">
                                {formatTimestamp(msg.timestamp)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getFullTimestamp(msg.timestamp)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-lg hover:bg-muted"
                                onClick={() => handleCopy(msg.content, msg.id)}
                              >
                                {copiedId === msg.id ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Clipboard className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedId === msg.id ? 'Copied' : 'Copy'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center overflow-hidden">
                      <img
                        src={accountData?.profileImageUrl || DummyProfile}
                        alt="profile"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}

            {isLoading &&
              (() => {
                const lastMessage = messages[messages.length - 1];
                const hasImageSkeleton =
                  lastMessage?.role === 'assistant' &&
                  lastMessage?.content?.includes(':::image-skeleton');

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
          <div className="fixed bottom-[178px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
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

      <div className="p-4 bg-background border-t border-border">
        <div className="bg-muted/40 rounded-2xl p-4">
          <div className="flex flex-col gap-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type here..."
              className="bg-transparent border-0 focus-visible:ring-0 shadow-none px-0 text-base placeholder:text-muted-foreground/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GroupedModelSelector value={selectedModel} onChange={setSelectedModel} />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30"
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
