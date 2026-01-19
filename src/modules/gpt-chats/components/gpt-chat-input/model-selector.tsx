import { useState, useMemo } from 'react';
import { Check, ChevronDown, Sparkles, Zap, Brain, Code, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-kit/popover';
import { cn } from '@/lib/utils';
import { useGetLlmModels } from '@/modules/gpt-chats/hooks/use-gpt-chat';

const providerColors: Record<string, { color: string; bgColor: string; icon: typeof Sparkles }> = {
  OpenAI: { color: 'text-green-500', bgColor: 'bg-green-500/10', icon: Sparkles },
  Google: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Zap },
  Anthropic: { color: 'text-orange-500', bgColor: 'bg-orange-500/10', icon: Code },
  DeepSeek: { color: 'text-purple-500', bgColor: 'bg-purple-500/10', icon: Brain },
};

const getProviderConfig = (provider: string) => {
  return (
    providerColors[provider] || {
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
      icon: Sparkles,
    }
  );
};

interface GroupedModelSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const GroupedModelSelector = ({ value = '', onChange }: GroupedModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'providers' | 'models'>('providers');
  const { data: models, isLoading, error } = useGetLlmModels();

  const groupedModels = useMemo(() => {
    if (!models) return [];

    const grouped = models.reduce(
      (acc, model) => {
        const existingGroup = acc.find((g) => g.provider === model.provider);
        if (existingGroup) {
          existingGroup.models.push(model);
        } else {
          acc.push({
            provider: model.provider,
            provider_label: model.provider_label,
            models: [model],
          });
        }
        return acc;
      },
      [] as Array<{
        provider: string;
        provider_label: string;
        models: typeof models;
      }>
    );

    return grouped.sort((a, b) => a.provider.localeCompare(b.provider));
  }, [models]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !selectedProvider && groupedModels.length > 0) {
      setSelectedProvider(groupedModels[0].provider);
      setMobileView('providers');
    }
  };

  const selectedModel = useMemo(() => {
    if (!models) return null;
    return models.find((m) => m.model_name === value) || models[0];
  }, [models, value]);

  const selectedProviderGroup = useMemo(() => {
    return groupedModels.find((g) => g.provider === selectedProvider);
  }, [groupedModels, selectedProvider]);

  const handleSelect = (modelName: string) => {
    onChange?.(modelName);
    setOpen(false);
    setSelectedProvider(null);
    setMobileView('providers');
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setMobileView('models');
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-[220px] h-10 justify-between bg-card/50 border-border/50 rounded-xl px-3"
      >
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </Button>
    );
  }

  if (error || !selectedModel) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-[220px] h-10 justify-between bg-card/50 border-border/50 rounded-xl px-3"
      >
        <span className="text-sm text-muted-foreground">No models available</span>
      </Button>
    );
  }

  const providerConfig = getProviderConfig(selectedModel.provider);
  const ProviderIcon = providerConfig.icon;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] h-11 justify-between bg-card/50 hover:bg-card border-border/50  transition-all duration-200 rounded-xl px-3 group"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={cn(
                'p-1.5 rounded-lg flex-shrink-0 transition-all duration-200',
                providerConfig.bgColor,
                'group-hover:scale-110'
              )}
            >
              <ProviderIcon className={cn('h-3.5 w-3.5', providerConfig.color)} />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate w-full text-left">
                {selectedModel.model_name_label || selectedModel.model_name}
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
        className="w-[95vw] sm:w-[600px] lg:w-[720px] p-0 rounded-2xl border-border/50 shadow-xl"
        align="start"
      >
        <div className="flex h-[450px] sm:h-[420px]">
          <div
            className={cn(
              'w-full sm:w-[200px] border-r border-border/30 flex flex-col bg-muted/20',
              mobileView === 'models' && 'hidden sm:flex'
            )}
          >
            <div className="px-3 py-2.5 border-b border-border/30 bg-muted/40 backdrop-blur-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Providers
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {groupedModels.map((group) => {
                  const groupConfig = getProviderConfig(group.provider);
                  const GroupIcon = groupConfig.icon;
                  const isProviderSelected = selectedProvider === group.provider;

                  return (
                    <button
                      key={group.provider}
                      onClick={() => handleProviderSelect(group.provider)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-all duration-200 rounded-xl group/provider relative',
                        isProviderSelected
                          ? 'bg-primary/15  shadow-sm'
                          : 'hover:bg-accent/50 border-2 border-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'p-1.5 rounded-lg flex-shrink-0 transition-all duration-200',
                          groupConfig.bgColor,
                          !isProviderSelected && 'group-hover/provider:scale-110'
                        )}
                      >
                        <GroupIcon className={cn('h-3.5 w-3.5', groupConfig.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium text-sm truncate transition-colors',
                            isProviderSelected && 'text-primary'
                          )}
                        >
                          {group.provider_label || group.provider}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.models.length} {group.models.length === 1 ? 'model' : 'models'}
                        </p>
                      </div>
                      {isProviderSelected && (
                        <div className="w-1 h-8 bg-primary rounded-l-full absolute right-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={cn(
              'flex-1 flex flex-col min-w-0',
              mobileView === 'providers' && 'hidden sm:flex'
            )}
          >
            {selectedProviderGroup ? (
              <>
                <div className="px-3 sm:px-4 py-2.5 border-b border-border/30 bg-muted/20 backdrop-blur-sm flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sm:hidden h-7 w-7 p-0 rounded-lg"
                    onClick={() => setMobileView('providers')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate flex-1">
                    {selectedProviderGroup.provider_label || selectedProviderGroup.provider} Models
                  </p>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {selectedProviderGroup.models.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProviderGroup.models.map((model) => {
                      const isSelected = value === model.model_name;
                      return (
                        <button
                          key={model.model_name}
                          onClick={() => handleSelect(model.model_name)}
                          className={cn(
                            'group/model flex flex-col gap-2 p-2.5 sm:p-3 rounded-xl text-left transition-all duration-200 border-2 relative overflow-hidden',
                            isSelected
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-card/50 border-border/40 hover:bg-accent/50 hover:border-primary/20 hover:shadow-sm'
                          )}
                        >
                          {!isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover/model:opacity-100 transition-opacity duration-300" />
                          )}

                          <div className="flex items-start justify-between gap-2 relative z-10">
                            <p
                              className={cn(
                                'font-medium text-sm truncate flex-1 transition-colors',
                                isSelected && 'text-primary'
                              )}
                              title={model.model_name_label || model.model_name}
                            >
                              {model.model_name_label || model.model_name}
                            </p>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0 animate-in zoom-in-50 duration-200" />
                            )}
                          </div>

                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-md border border-border/30 w-fit relative z-10">
                            {model.model_type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Select a provider</p>
                  <p className="text-xs text-muted-foreground/60">
                    Choose from the {groupedModels.length} providers available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
