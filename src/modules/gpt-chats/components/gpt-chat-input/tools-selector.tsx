import { useState } from 'react';
import { Check, ChevronDown, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-kit/popover';
import { cn } from '@/lib/utils';
import { useGetTools } from '@/modules/gpt-chats/hooks/use-gpt-chat';

interface ToolsSelectorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  tenantId?: string;
}

export const ToolsSelector = ({ value = [], onChange, tenantId }: ToolsSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [toolType, setToolType] = useState<'api' | 'mcp_server'>('api');

  const { data: toolsData, isLoading } = useGetTools({
    tool_type: toolType,
    page: 1,
    page_size: 50,
    project_key: tenantId,
  });

  const handleToggleTool = (toolId: string) => {
    const newValue = value.includes(toolId)
      ? value.filter((id) => id !== toolId)
      : [...value, toolId];
    onChange?.(newValue);
  };

  const formatToolType = (type: string) => {
    if (type === 'mcp_server') return 'MCP Server';
    return type.toUpperCase();
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-[180px] h-11 justify-between bg-card/50 border-border/50 rounded-xl px-3"
      >
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </Button>
    );
  }

  const selectedCount = value.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] h-11 justify-between bg-card/50 hover:bg-card border-border/50 transition-all duration-200 rounded-xl px-3 group"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg flex-shrink-0 transition-all duration-200 bg-primary/10 group-hover:scale-110">
              <Wrench className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate w-full text-left">
                {selectedCount === 1
                  ? '1 Tool'
                  : selectedCount > 1
                    ? `${selectedCount} Tools`
                    : 'Select Tools'}
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
        className="w-[95vw] sm:w-[420px] lg:w-[480px] p-0 rounded-2xl border-border/50 shadow-xl"
        align="start"
      >
        <div className="flex flex-col h-[380px] sm:h-[360px]">
          <div className="px-4 py-3 border-b border-border/30 bg-muted/20 backdrop-blur-sm space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Tools
            </p>

            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => setToolType('api')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                  toolType === 'api'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                API Tools
              </button>
              <button
                onClick={() => setToolType('mcp_server')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                  toolType === 'mcp_server'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                MCP Server
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {toolsData?.tools && toolsData.tools.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {toolsData.tools.map((tool) => {
                  const isSelected = value.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToggleTool(tool.id)}
                      className={cn(
                        'group/tool flex flex-col gap-2.5 p-3.5 rounded-xl text-left transition-all duration-200 border relative overflow-hidden',
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'bg-card border-border/50 hover:border-primary hover:shadow-sm'
                      )}
                    >
                      {!isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover/tool:opacity-100 transition-opacity duration-300" />
                      )}

                      {isSelected && (
                        <div className="absolute top-0 right-0 w-16 h-16 -translate-y-8 translate-x-8 bg-primary/10 rounded-full blur-xl" />
                      )}

                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div
                              className={cn(
                                'p-1.5 rounded-lg transition-all duration-200',
                                isSelected
                                  ? 'bg-primary/15'
                                  : 'bg-muted/50 group-hover/tool:bg-primary/10'
                              )}
                            >
                              <Wrench
                                className={cn(
                                  'h-3.5 w-3.5 transition-colors',
                                  isSelected
                                    ? 'text-primary'
                                    : 'text-muted-foreground group-hover/tool:text-primary'
                                )}
                              />
                            </div>
                            <p
                              className={cn(
                                'font-semibold text-sm truncate transition-colors',
                                isSelected ? 'text-primary' : 'text-foreground'
                              )}
                              title={tool.name}
                            >
                              {tool.name}
                            </p>
                          </div>

                          {tool.description && (
                            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                              {tool.description}
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <div className="p-1 rounded-full bg-primary/15">
                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 animate-in zoom-in-50 duration-200" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center relative z-10">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-md text-xs font-medium transition-colors bg-muted/50 text-muted-foreground border border-border/30'
                          )}
                        >
                          {formatToolType(tool.type)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="p-3 rounded-full bg-muted/50">
                  <Wrench className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No tools available</p>
                <p className="text-xs text-muted-foreground/60">
                  {toolType === 'api' ? 'No API tools found' : 'No MCP servers found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
