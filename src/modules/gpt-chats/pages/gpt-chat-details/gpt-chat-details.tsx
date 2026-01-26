import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { Clipboard, Check, Zap } from 'lucide-react';
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
  <div className="flex gap-4 animate-in fade-in duration-300 items-start ml-1">
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
  <div className="flex gap-4 animate-in fade-in duration-300 items-start ml-1">
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
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isBotThinking]);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    sendMessage({ message });
  };

  const handleCopy = (content: string, messageId: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (content: string, isStreaming = false) => {
    return (
      <div className="text-[15px]">
        <div className="inline-block relative">
          <MarkdownRenderer content={content} />
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
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isReady && (
          <div className="max-w-4xl mx-auto px-4 py-6 pb-[250px] space-y-12">
            {conversations.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'bot' ? 'items-start' : ''}`}
              >
                {msg.type === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <img src={botLogoSELISEAI} alt="bot" className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`group flex-1 relative ${msg.type === 'user' ? 'flex justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[90%] py-1 ${msg.type === 'user' && 'bg-accent rounded px-5'}`}
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
                                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
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

            {isBotThinking && currentEvent && (
              <ChatEventMessageIndicator message={currentEvent.message} />
            )}

            {isBotThinking && !currentEvent && <ThinkingIndicator />}

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
