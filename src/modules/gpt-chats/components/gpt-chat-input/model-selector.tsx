import { useState } from 'react';
import { Check, ChevronDown, Sparkles, Zap, Brain, Code, Bot } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-kit/popover';
import { cn } from '@/lib/utils';

const modelGroups = [
  {
    provider: 'Google',
    models: [
      {
        id: 'gemini-3-flash',
        name: 'Gemini 3 Flash',
        description: 'Fast and efficient',
        icon: Zap,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
      },
      {
        id: 'gemini-3-pro',
        name: 'Gemini 3 Pro',
        description: 'Advanced capabilities',
        icon: Sparkles,
        color: 'text-blue-600',
        bgColor: 'bg-blue-600/10',
      },
    ],
  },
  {
    provider: 'OpenAI',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable',
        icon: Sparkles,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Faster GPT-4',
        icon: Zap,
        color: 'text-green-600',
        bgColor: 'bg-green-600/10',
      },
    ],
  },
  {
    provider: 'Anthropic',
    models: [
      {
        id: 'claude-3',
        name: 'Claude 3 Opus',
        description: 'Advanced reasoning',
        icon: Code,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance',
        icon: Bot,
        color: 'text-orange-600',
        bgColor: 'bg-orange-600/10',
      },
    ],
  },
  {
    provider: 'DeepSeek',
    models: [
      {
        id: 'deepseek-v3',
        name: 'DeepSeek v3.1',
        description: '671B parameters',
        icon: Brain,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
      },
    ],
  },
];

// Flatten models for easy lookup
const allModels = modelGroups.flatMap((group) =>
  group.models.map((model) => ({ ...model, provider: group.provider }))
);

interface GroupedModelSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const GroupedModelSelector = ({
  value = 'gemini-3-flash',
  onChange,
}: GroupedModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const selectedModel = allModels.find((m) => m.id === value) || allModels[0];
  const Icon = selectedModel.icon;

  const handleSelect = (modelId: string) => {
    onChange?.(modelId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] h-10 justify-between bg-card/50 hover:bg-card border-border/50 hover:border-primary transition-all duration-200 rounded-xl px-3 group"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={cn(
                'p-1.5 rounded-lg flex-shrink-0 transition-all duration-200',
                selectedModel.bgColor,
                'group-hover:scale-110'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', selectedModel.color)} />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate w-full text-left">
                {selectedModel.name}
              </span>
              <span className="text-xs text-muted-foreground truncate w-full text-left">
                {selectedModel.provider}
              </span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 opacity-50 transition-all duration-200',
              open && 'rotate-180'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-2 rounded-2xl border-border/50 shadow-lg"
        align="start"
      >
        <div className="max-h-[400px] overflow-y-auto">
          <div className="px-3 py-2 sticky top-0 bg-popover/95 backdrop-blur-sm z-10 border-b border-border/50 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select AI Model
            </p>
          </div>

          <div className="space-y-4">
            {modelGroups.map((group) => (
              <div key={group.provider}>
                <div className="px-3 py-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs font-semibold text-muted-foreground px-2">
                      {group.provider}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                </div>

                <div className="space-y-1 px-1">
                  {group.models.map((model) => {
                    const ModelIcon = model.icon;
                    const isSelected = value === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleSelect(model.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm transition-all duration-200 group/item',
                          isSelected
                            ? 'bg-primary/10 border-2 border-primary shadow-sm'
                            : 'hover:bg-accent/50 border-2 border-transparent hover:border-border/50'
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            'p-2 rounded-lg flex-shrink-0 transition-all duration-200',
                            model.bgColor,
                            !isSelected && 'group-hover/item:scale-110'
                          )}
                        >
                          <ModelIcon className={cn('h-4 w-4', model.color)} />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                'font-medium truncate transition-colors',
                                isSelected && 'text-primary'
                              )}
                            >
                              {model.name}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {model.description}
                          </p>
                        </div>

                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0 animate-in zoom-in-50 duration-200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
