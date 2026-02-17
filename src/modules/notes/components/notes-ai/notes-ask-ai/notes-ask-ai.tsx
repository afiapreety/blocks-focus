import { useState } from 'react';
import { MessageCircle, Edit, Mic, ArrowUp } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui-kit/select';

export function AIChatSheet() {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('ministral-3:14b');

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Implement send message logic
      setMessage('');
    }
  };

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-screen sm:h-[calc(100dvh-48px)] w-full sm:min-w-[450px] md:min-w-[450px] lg:min-w-[450px] sm:fixed sm:top-[57px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <SheetHeader className="flex-row items-center space-y-0">
              <SheetTitle className="text-base font-semibold">Chat</SheetTitle>
            </SheetHeader>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-background">
          {/* Chat messages will go here */}
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
                  <Button variant="ghost" size="sm" className="h-9 gap-2 px-3">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>

                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-9 w-auto bg-transparent border-0 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ministral-3:14b">ministral-3:14b</SelectItem>
                      <SelectItem value="deepseek-v3.1:671b">deepseek-v3.1:671b</SelectItem>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30"
                    onClick={handleSend}
                    disabled={!message.trim()}
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
