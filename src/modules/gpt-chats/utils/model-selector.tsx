import { Brain, Code, Sparkles, Zap } from 'lucide-react';

export const providerColors: Record<
  string,
  { color: string; bgColor: string; icon: typeof Sparkles }
> = {
  OpenAI: { color: 'text-green-500', bgColor: 'bg-green-500/10', icon: Sparkles },
  Google: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Zap },
  Anthropic: { color: 'text-orange-500', bgColor: 'bg-orange-500/10', icon: Code },
  DeepSeek: { color: 'text-purple-500', bgColor: 'bg-purple-500/10', icon: Brain },
};

export const getProviderConfig = (provider: string) => {
  return (
    providerColors[provider] || {
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
      icon: Sparkles,
    }
  );
};

export const formatProviderName = (provider: string): string => {
  const lowerProvider = provider.toLowerCase();

  if (lowerProvider === 'openai') return 'OpenAI';
  if (lowerProvider === 'deepseek') return 'DeepSeek';
  if (lowerProvider === 'openrouter') return 'OpenRouter';
  if (lowerProvider === 'huggingface') return 'HuggingFace';
  if (lowerProvider === 'xai') return 'xAI';

  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
};
