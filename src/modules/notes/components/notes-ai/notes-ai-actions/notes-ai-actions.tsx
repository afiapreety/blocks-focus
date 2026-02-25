import { Button } from '@/components/ui-kit/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui-kit/tooltip';
import { GroupedModelSelector } from '@/modules/gpt-chats/components/gpt-chat-input/model-selector';
import { SelectModelType } from '@/modules/gpt-chats/hooks/use-chat-store';
import { SlidersHorizontal, Sparkles, MessageCircle } from 'lucide-react';

interface NoteAIActionsProps {
  selectedModel: SelectModelType | undefined;
  onModelChange: (model: SelectModelType | undefined) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
  editorMode?: 'edit' | 'preview';
  onChatToggle?: () => void;
  isChatOpen?: boolean;
}

export function NoteAIActions({
  selectedModel,
  onModelChange,
  onEnhance,
  isEnhancing,
  editorMode = 'edit',
  onChatToggle,
  isChatOpen = false,
}: NoteAIActionsProps) {
  return (
    <>
      {/* AI Settings Dropdown */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end" className="w-[400px] p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">AI Settings</label>
            </div>

            <div
              className="
                [&_.w-\[220px\]]:w-full
                [&_.rounded-xl]:rounded-lg
                [&_.w-\[95vw\]]:w-full
                [&_.sm\:w-\[420px\]]:w-[280px]
                [&_.h-\[320px\]]:h-[280px]
                [&_.sm\:w-\[200px\]]:w-[100px]
                [&_.group\/model]:!border-0
                [&_.group\/model]:p-2
                [&_.group\/model]:rounded-lg
                [&_.group\/model]:w-full
                [&_.group\/model.border-primary]:!border-0
                [&_.group\/model.bg-primary\/10]:bg-accent
                [&_.group\/model.bg-primary\/10]:!border-0
                [&_.group\/model.bg-primary\/10]:relative
                [&_.group\/model.bg-primary\/10]:before:absolute
                [&_.group\/model.bg-primary\/10]:before:left-0
                [&_.group\/model.bg-primary\/10]:before:top-1/2
                [&_.group\/model.bg-primary\/10]:before:-translate-y-1/2
                [&_.group\/model.bg-primary\/10]:before:w-[3px]
                [&_.group\/model.bg-primary\/10]:before:h-[60%]
                [&_.group\/model.bg-primary\/10]:before:bg-primary
                [&_.group\/model.bg-primary\/10]:before:rounded-r-full
                [&_.group\/model]:hover:bg-accent/80
                [&_.flex.flex-row.flex-wrap]:flex-col
                [&_.flex.flex-row.flex-wrap]:gap-1
              "
            >
              <GroupedModelSelector value={selectedModel} onChange={onModelChange} />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Enhance with AI - only show in Edit mode */}
      {onEnhance && editorMode === 'edit' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEnhance}
                disabled={isEnhancing}
              >
                <Sparkles className={`h-4 w-4 ${isEnhancing ? 'animate-pulse' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Chat Toggle */}
      {onChatToggle && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onChatToggle}>
                <MessageCircle className={`h-4 w-4 ${isChatOpen ? 'text-primary' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isChatOpen ? 'Close Chat' : 'Chat with AI'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}
