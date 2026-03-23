import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Mic, ArrowUp, Trash2, Clipboard, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui-kit/sheet';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import { useNotesChat } from '../../../hooks/use-notes-chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { GroupedModelSelector } from '@/modules/gpt-chats/components/gpt-chat-input/model-selector';
import { SelectModelType } from '@/modules/gpt-chats/types/chat-store.types';
import { MarkdownRenderer } from '@/modules/gpt-chats/components/markdown-renderer/markdown-renderer';
import { ChatEventMessage, SparkleText } from '@/modules/gpt-chats/utils/chat-event-messages';
import botLogoSELISEAI from '@/assets/images/selise_ai_small.png';
import { useGetAccount } from '@/modules/profile/hooks/use-account';
import DummyProfile from '@/assets/images/dummy_profile.png';

interface AIChatSheetProps {
  noteContent?: string;
}

export function AIChatSheet({ noteContent }: AIChatSheetProps = {}) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<SelectModelType>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
  });
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: accountData } = useGetAccount();

  const { messages, isLoading, isStreaming, currentEvent, sendMessage, clearChat } = useNotesChat({
    noteContent,
  });

  const scrollToBottom = useCallback(() => {
    const behavior = isStreaming ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, [isStreaming]);

  useEffect(() => {
    const delay = isStreaming ? 10 : 100;
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [messages, isStreaming, scrollToBottom]);

  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = message;
      setMessage('');
      await sendMessage(userMessage, selectedModel);
    }
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

  const renderMessageContent = (content: string, streaming = false) => {
    return (
      <div className="text-[15px]">
        <div className="inline-block relative">
          <MarkdownRenderer content={content} />
          {streaming && (
            <>
              <span
                className="absolute w-[2px] h-[1.2em] bg-primary ml-[2px]"
                style={{
                  bottom: '0.2em',
                  right: '-4px',
                  animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </>
          )}
        </div>
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

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-screen sm:h-[calc(100dvh-48px)] w-full sm:min-w-[450px] md:min-w-[450px] lg:min-w-[450px] sm:fixed sm:top-[57px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pr-12 border-b border-border">
          <SheetHeader className="flex-row items-center space-y-0">
            <SheetTitle className="text-base font-semibold">Chat</SheetTitle>
          </SheetHeader>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-background p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Start a conversation about your note
                </p>
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
                        msg.role === 'assistant' ? 'min-h-[32px]' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[90%] py-1',
                          msg.role === 'user' && 'bg-accent rounded-xl px-4 py-2'
                        )}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-[15px] leading-7 whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          renderMessageContent(msg.content, msg.streaming && isStreaming)
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

        {/* Input Section */}
        <div className="p-4 bg-background">
          <div className="bg-muted/40 rounded-2xl p-4">
            <div className="flex flex-col gap-4">
              {/* Text Input */}
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

              {/* Action Bar */}
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
      </SheetContent>
    </Sheet>
  );
}
