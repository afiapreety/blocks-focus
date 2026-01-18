import { useState, useRef, useEffect, JSX } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui-kit/select';
import {
  Search,
  Paperclip,
  ArrowUp,
  Mic,
  Plus,
  Globe,
  FileImage,
  Video,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Check,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const GptChatPageDetails = () => {
  const { chatId } = useParams();
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash');
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedMessages = localStorage.getItem(`chat-${chatId}`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      const dummyMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'How can I build a REST API with Node.js and Express?',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '2',
          role: 'assistant',
          content: `To build a REST API with Node.js and Express, follow these steps:

1. **Initialize your project:**
\`\`\`bash
npm init -y
npm install express
\`\`\`

2. **Create a basic server:**
\`\`\`javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob', 'Charlie'] });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
\`\`\`

3. **Add more routes:**
- GET for retrieving data
- POST for creating data
- PUT/PATCH for updating data
- DELETE for removing data

4. **Best practices:**
- Use middleware for validation
- Implement error handling
- Add authentication
- Use environment variables

Would you like me to elaborate on any of these steps?`,
          timestamp: new Date(Date.now() - 3500000),
        },
        {
          id: '3',
          role: 'user',
          content: 'Yes, can you show me how to add authentication with JWT?',
          timestamp: new Date(Date.now() - 3400000),
        },
        {
          id: '4',
          role: 'assistant',
          content: `Sure! Here's how to implement JWT authentication:

1. **Install required packages:**
\`\`\`bash
npm install jsonwebtoken bcryptjs
\`\`\`

2. **Create authentication middleware:**
\`\`\`javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
\`\`\`

3. **Create login route:**
\`\`\`javascript
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Verify user credentials (example)
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
  
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});
\`\`\`

4. **Protect routes:**
\`\`\`javascript
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
\`\`\`

This gives you a basic JWT authentication system!`,
          timestamp: new Date(Date.now() - 3300000),
        },
      ];
      setMessages(dummyMessages);
      localStorage.setItem(`chat-${chatId}`, JSON.stringify(dummyMessages));
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`chat-${chatId}`, JSON.stringify(updatedMessages));
      setMessage('');

      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I received your message: "${message}". This is a demo response. In a real application, this would be processed by an AI model.`,
          timestamp: new Date(),
        };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        localStorage.setItem(`chat-${chatId}`, JSON.stringify(finalMessages));
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (content: string) => {
    const parts: JSX.Element[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeLanguage = '';

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          parts.push(
            <div key={`code-${index}`} className="my-4 group/code relative">
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover/code:opacity-100 transition-all duration-200"
                  onClick={() => handleCopy(codeBlockContent.join('\n'), `code-${index}`)}
                >
                  {copiedId === `code-${index}` ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
                {codeLanguage && (
                  <div className="px-4 py-2 border-b border-border/50 bg-muted/30 text-xs text-muted-foreground font-medium">
                    {codeLanguage}
                  </div>
                )}
                <pre className="p-4 overflow-x-auto">
                  <code className="text-sm font-mono leading-relaxed">
                    {codeBlockContent.join('\n')}
                  </code>
                </pre>
              </div>
            </div>
          );
          codeBlockContent = [];
        }
      } else if (inCodeBlock) {
        codeBlockContent.push(line);
      } else {
        if (line.trim()) {
          const formattedLine = line.split('**').map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-foreground">
                {part}
              </strong>
            ) : (
              part
            )
          );

          if (line.trim().startsWith('-')) {
            parts.push(
              <div key={index} className="flex gap-2 my-1.5 ml-4">
                <span className="text-primary mt-1.5">•</span>
                <span className="flex-1 leading-relaxed">{formattedLine}</span>
              </div>
            );
          } else if (/^\d+\./.test(line.trim())) {
            parts.push(
              <div key={index} className="flex gap-2 my-1.5 ml-4">
                <span className="text-primary font-medium min-w-[20px]">
                  {line.trim().match(/^\d+\./)?.[0]}
                </span>
                <span className="flex-1 leading-relaxed">
                  {line
                    .replace(/^\d+\.\s*/, '')
                    .split('**')
                    .map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="font-semibold text-foreground">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                </span>
              </div>
            );
          } else {
            parts.push(
              <p key={index} className="my-2 leading-relaxed">
                {formattedLine}
              </p>
            );
          }
        } else {
          parts.push(<div key={index} className="h-2" />);
        }
      }
    });

    return <div className="text-sm text-foreground/90">{parts}</div>;
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-background to-muted/20">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}

              <div className={`group ${msg.role === 'user' ? '' : 'flex-1 max-w-3xl'}`}>
                <div
                  className={`relative ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-3xl px-6 py-4 shadow-lg shadow-primary/30 ml-auto max-w-sm border-1 border-primary/20'
                      : 'bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl px-6 py-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.content}
                    </p>
                  ) : (
                    renderMessageContent(msg.content)
                  )}
                </div>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      onClick={() => handleCopy(msg.content, msg.id)}
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          <span className="text-xs">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          <span className="text-xs">Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div
                  className={`text-xs text-muted-foreground/60 mt-2 ${
                    msg.role === 'user' ? 'text-right mr-2' : 'ml-2'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent/80 border border-border flex items-center justify-center shadow-sm">
                  <User className="h-5 w-5 text-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border/50 bg-gradient-to-b from-background/95 to-card/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border hover:border-primary/30 focus-within:border-primary/50 transition-all duration-300 shadow-xl shadow-black/5">
            {/* Textarea */}
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything..."
              className="min-h-[80px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 px-6 py-5 text-base placeholder:text-muted-foreground/60"
            />

            {/* Send Button */}
            <div className="absolute bottom-[72px] right-4">
              <Button
                size="icon"
                className={`h-10 w-10 rounded-2xl transition-all duration-300 ${
                  message.trim()
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:scale-110'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2 border-t border-border/50">
              {/* Left Side - Model Selector & Tools */}
              <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[180px] h-9 border-0 bg-muted/50 hover:bg-muted rounded-xl text-sm transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-3-flash">Gemini 3 Flash</SelectItem>
                    <SelectItem value="deepseek-v3">deepseek-v3.1:671b</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>

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

              {/* Right Side - Additional Actions */}
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

          {/* Helper Text */}
          <p className="text-xs text-center text-muted-foreground/70 mt-3">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> to send,{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
};
