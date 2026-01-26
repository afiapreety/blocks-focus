import { useState } from 'react';
// import { Button } from '@/components/ui-kit/button';
import { SelectModelType, useChatStore } from '@/modules/gpt-chats/hooks/use-chat-store';
// import {
//   Sparkles,
//   Compass,
//   Code,
//   GraduationCap,
//   Zap,
//   Lightbulb,
//   Database,
//   BookOpen,
//   LucideIcon,
//   Paintbrush,
//   MapPin,
//   Globe,
// } from 'lucide-react';
import { GptChatInput } from '@/modules/gpt-chats/components/gpt-chat-input/gpt-chat-input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// const categoryPrompts: Record<
//   string,
//   Array<{ icon: LucideIcon; title: string; description: string; id: string }>
// > = {
//   create: [
//     {
//       id: '1',
//       icon: Paintbrush,
//       title: 'Design a landing page',
//       description: 'for a sustainable fashion brand',
//     },
//     {
//       id: '2',
//       icon: Sparkles,
//       title: 'Write a creative story',
//       description: 'about time travel and friendship',
//     },
//     {
//       id: '3',
//       icon: Zap,
//       title: 'Generate marketing copy',
//       description: 'for a new AI productivity tool',
//     },
//     {
//       id: '4',
//       icon: Lightbulb,
//       title: 'Brainstorm startup ideas',
//       description: 'in the climate tech space',
//     },
//   ],
//   explore: [
//     {
//       id: '5',
//       icon: MapPin,
//       title: 'Plan a 2-week trip',
//       description: 'to Japan with cultural highlights',
//     },
//     {
//       id: '6',
//       icon: Compass,
//       title: 'Discover hidden gems',
//       description: 'in European architecture',
//     },
//     {
//       id: '7',
//       icon: Globe,
//       title: 'Compare different cultures',
//       description: 'approach to work-life balance',
//     },
//     {
//       id: '8',
//       icon: Sparkles,
//       title: 'Explore future trends',
//       description: 'in renewable energy',
//     },
//   ],
//   code: [
//     {
//       id: '9',
//       icon: Code,
//       title: 'Build a REST API',
//       description: 'with Node.js and Express',
//     },
//     {
//       id: '10',
//       icon: Database,
//       title: 'Optimize SQL queries',
//       description: 'for better performance',
//     },
//     {
//       id: '11',
//       icon: Zap,
//       title: 'Debug React component',
//       description: 'with rendering issues',
//     },
//     {
//       id: '12',
//       icon: Code,
//       title: 'Implement authentication',
//       description: 'using JWT and refresh tokens',
//     },
//   ],
//   learn: [
//     {
//       id: '13',
//       icon: GraduationCap,
//       title: "Beginner's guide to TypeScript",
//       description: 'with practical examples',
//     },
//     {
//       id: '14',
//       icon: BookOpen,
//       title: 'Explain the CAP theorem',
//       description: 'in distributed systems',
//     },
//     {
//       id: '15',
//       icon: Lightbulb,
//       title: 'Why is AI so expensive?',
//       description: 'Break down the costs',
//     },
//     {
//       id: '16',
//       icon: Sparkles,
//       title: 'Are black holes real?',
//       description: 'Explore the science behind them',
//     },
//   ],
// };

// const categories = [
//   { id: 'create', label: 'Create', icon: Sparkles },
//   { id: 'explore', label: 'Explore', icon: Compass },
//   { id: 'code', label: 'Code', icon: Code },
//   { id: 'learn', label: 'Learn', icon: GraduationCap },
// ];

export const GptChatPage = () => {
  const navigate = useNavigate();
  // const [selectedCategory, setSelectedCategory] = useState<string>('learn');
  const [selectModel, setSelectedModel] = useState<SelectModelType>({
    isBlocksModels: true,
    provider: 'azure',
    model: 'gpt-4o-mini',
  });
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { startChat } = useChatStore();
  const { t } = useTranslation();

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      startChat(message, selectModel, selectedTools, navigate);
    }
  };

  // const handlePromptClick = (prompt: { title: string; description: string }) => {
  //   handleSendMessage(`${prompt.title} ${prompt.description}`);
  // };
  // random id from 1 to 10
  const randomId = Math.floor(Math.random() * 10) + 1;
  const NEW_CHAT_PAGE_HEADER = t(`NEW_CHAT_PAGE_HEADER_${randomId}`);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-background to-muted/20 overflow-y-auto pb-[220px] sm:pb-[200px] md:pb-[180px]">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full py-4">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {NEW_CHAT_PAGE_HEADER}
          </h1>

          {/* <p className="text-muted-foreground text-sm sm:text-base">
            {t('NEW_CHAT_PAGE_SUBHEADER')}
          </p> */}
        </div>

        {/* Category Tabs */}
        {/* <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-10 flex-wrap">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isActive ? 'default' : 'outline'}
                size="default"
                onClick={() => setSelectedCategory(category.id)}
                className={`gap-2 px-4 sm:px-6 py-3 sm:py-5 rounded-2xl transition-all duration-300 text-sm sm:text-base ${
                  isActive
                    ? 'bg-primary  text-white  scale-105 hover:bg-primary-300'
                    : 'bg-card/50 hover:bg-accent border-2 hover:scale-105'
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {category.label}
              </Button>
            );
          })}
        </div> */}

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full max-w-4xl mb-4 sm:mb-6">
          {categoryPrompts[selectedCategory].map((prompt) => {
            const PromptIcon = prompt.icon;
            return (
              <button
                key={prompt.id}
                onClick={() => handlePromptClick(prompt)}
                className="group relative overflow-hidden text-left p-5 rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm hover:bg-accent/50  transition-all duration-300   hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110">
                    <PromptIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {prompt.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {prompt.description}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </button>
            );
          })}
        </div> */}
        <GptChatInput
          onSendMessage={handleSendMessage}
          selectedModel={selectModel}
          onModelChange={setSelectedModel}
          selectedTools={selectedTools}
          onToolsChange={setSelectedTools}
          className=" static w-full md:m-0"
        />
      </div>
    </div>
  );
};
