import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import { GptChatInput } from '../../components/gpt-chat-input/gpt-chat-input';
import { useChatSSE } from '../../hooks/use-chat-sse';
import { MarkdownRenderer } from '../../components/markdown-renderer/markdown-renderer';

const ThinkingIndicator = () => (
  <div className="flex gap-4 animate-in fade-in duration-300">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
      <Bot className="h-4 w-4 text-white" />
    </div>
    <div className="flex-1 py-3">
      <div className="flex items-center gap-1">
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
      </div>
    </div>
  </div>
);

export const GptChatPageDetails = () => {
  const { chatId } = useParams();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const { sendMessage, conversations, isBotStreaming, isBotThinking, generateBotMessage } =
    useChatSSE({ chatId });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isBotThinking]);

  // Auto-send the first message if chat was just created
  useEffect(() => {
    if (chatId && !hasInitialized.current) {
      const lastMessage = conversations[conversations.length - 1];
      if (lastMessage && lastMessage.type === 'user') {
        hasInitialized.current = true;
        generateBotMessage({ message: lastMessage.message });
      }
    }
  }, [chatId, conversations, generateBotMessage, isBotThinking, sendMessage]);

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
        <MarkdownRenderer content={content} />
        {isStreaming && (
          <span className="inline-block w-1.5 h-5 bg-foreground ml-0.5 animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto px-4 py-6 pb-64 space-y-6">
          {conversations.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full  flex items-center justify-center border">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div className={`group flex-1 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={`max-w-[90%] px-5 py-1 ${msg.type === 'user' && 'bg-accent rounded '}`}
                >
                  {msg.type === 'user' ? (
                    <p className="text-[15px] leading-7 whitespace-pre-wrap">{msg.message}</p>
                  ) : (
                    renderMessageContent(msg.message, msg.streaming && isBotStreaming)
                  )}
                </div>

                {msg.type === 'bot' && !msg.streaming && (
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-muted"
                      onClick={() => handleCopy(msg.message, index)}
                    >
                      {copiedId === index ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-muted"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-muted"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-muted"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {msg.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center">
                  <User className="h-4 w-4 " />
                </div>
              )}
            </div>
          ))}

          {isBotThinking && <ThinkingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <GptChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};
