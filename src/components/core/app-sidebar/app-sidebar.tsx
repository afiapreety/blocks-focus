import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui-kit/sidebar';
import { useTheme } from '@/styles/theme/theme-provider';
import { getSidebarStyle } from '@/lib/utils/sidebar-utils';
import { LogoSection } from '@/components/core';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui-kit/accordion';
import { useChatStore } from '@/modules/gpt-chats/hooks/use-chat-store';
import { Button } from '@/components/ui-kit/button';
import { PenSquare, Trash } from 'lucide-react';

export const AppSidebar = () => {
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const { chatId } = useParams();
  const { setOpenMobile, open, isMobile, openMobile } = useSidebar();
  const navigate = useNavigate();

  const { chats, deleteChat } = useChatStore();

  useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile, isMobile]);

  const sidebarStyle = getSidebarStyle(isMobile, open, openMobile);

  if (isMobile && !openMobile) {
    return null;
  }

  const handleNewChat = () => {
    navigate('/chat');
    // Implement the logic for creating a new chat
  };

  return (
    <Sidebar
      className={`bg-gradient-to-b from-card to-card/95 h-full border-r border-border/50 backdrop-blur-xl ${
        isMobile ? 'mobile-sidebar' : ''
      }`}
      collapsible={isMobile ? 'none' : 'icon'}
      style={sidebarStyle}
    >
      <SidebarHeader
        className={`${
          !open && !isMobile ? 'border-b border-border/50' : ''
        } p-3 bg-gradient-to-b from-background/50 to-transparent`}
      >
        <LogoSection
          theme={theme}
          open={open}
          isMobile={isMobile}
          onClose={() => setOpenMobile(false)}
        />
      </SidebarHeader>

      <SidebarContent className="text-base mx-3 my-4 text-high-emphasis font-normal overflow-x-hidden">
        <Button
          onClick={handleNewChat}
          variant={!isMobile ? 'outline' : 'ghost'}
          className={`mb-2 justify-start gap-2 ${
            !isMobile ? 'w-full' : 'w-full min-w-[48px] justify-center'
          }`}
          size="default"
        >
          <PenSquare className="h-4 w-4" />
          {!isMobile && <span>New Chat</span>}
        </Button>
        <Accordion type="single" collapsible defaultValue="list">
          <AccordionItem value="list" className="border-none">
            <AccordionTrigger className=" hover:no-underline justify-start gap-1 [&[data-state=closed]>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0">
              Your chats
            </AccordionTrigger>
            <AccordionContent>
              {Object.values(chats).length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">No chats available.</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {Object.values(chats)
                    .sort(
                      (a, b) =>
                        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
                    )
                    .map((chat) => (
                      <div
                        key={chat.id}
                        className="rounded-lg hover:bg-accent/50 cursor-pointer flex justify-between items-center h-fit group/item"
                        onClick={() => {
                          navigate(`/chat/${chat.id}`);
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <span className="text-sm text-high-emphasis truncate block">
                          {chat.conversations[1]?.message.slice(0, 30) || 'New Chat'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (chat.id) {
                              if (chat.id === chatId) {
                                navigate('/chat');
                              }
                              deleteChat(chat.id);
                            }
                          }}
                        >
                          <Trash className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
};
