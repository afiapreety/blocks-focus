import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui-kit/sheet';
import { Button } from '@/components/ui-kit/button';
import { MessageSquare } from 'lucide-react';

export function AIChatSheet() {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MessageSquare className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-screen sm:h-[calc(100dvh-48px)] justify-between w-full sm:min-w-[450px] md:min-w-[450px] lg:min-w-[450px] sm:fixed sm:top-[57px]">
        <SheetHeader className="hidden">
          <SheetTitle>Ask AI </SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Chat interface content...</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
