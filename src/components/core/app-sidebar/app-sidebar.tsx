import { useEffect, useMemo } from 'react';
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
import { Button } from '@/components/ui-kit/button';
import { PenSquare, Trash } from 'lucide-react';
import {
  useDeleteConversationById,
  useGetConversations,
} from '@/modules/gpt-chats/hooks/use-conversation-api';
import { useTranslation } from 'react-i18next';

const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';

export const AppSidebar = () => {
  const { chatId } = useParams();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const { setOpenMobile, open, isMobile, openMobile } = useSidebar();
  const { mutateAsync: deleteMutateAsync } = useDeleteConversationById();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data } = useGetConversations({
    limit: 10,
    offset: 0,
    allow_created_by_filter: true,
    call_from: projectSlug,
    project_key: projectKey,
  });

  useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile, isMobile]);

  const sidebarStyle = getSidebarStyle(isMobile, open, openMobile);
  const chatList = useMemo(() => {
    if (!data || data.total_count === 0) return [];

    return data.sessions.map((session) => ({
      id: session.session_id,
      lastEntryDate: session.last_entry_date,
      title:
        session.conversation.Title.slice(0, 30) ||
        session.conversation.Response.slice(0, 30) ||
        session.conversation.Query,
    }));
  }, [data]);

  if (isMobile && !openMobile) {
    return null;
  }

  const handleNewChat = () => {
    navigate('/chat');
  };

  const deleteHandler = (id: string) => {
    if (chatId === id) {
      navigate('/chat');
    }
    deleteMutateAsync({ session_id: id, project_key: projectKey });
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
          variant={open && !isMobile ? 'outline' : 'ghost'}
          className={`mb-2 gap-2 ${
            open && !isMobile ? 'w-full justify-start' : 'w-full min-w-[48px] justify-center'
          }`}
        >
          <PenSquare className="h-4 w-4" />
          {open && !isMobile && <span>{t('NEW_CHAT')}</span>}
        </Button>
        <Accordion type="single" collapsible defaultValue="list">
          <AccordionItem value="list" className="border-none">
            <AccordionTrigger className=" hover:no-underline justify-start gap-1 [&[data-state=closed]>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0">
              {t('YOUR_CHATS')}
            </AccordionTrigger>
            <AccordionContent>
              {chatList.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">{t('NO_CHATS_AVAILABLE')}</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {chatList
                    .sort(
                      (a, b) =>
                        new Date(b.lastEntryDate).getTime() - new Date(a.lastEntryDate).getTime()
                    )
                    .map((chat) => (
                      <div
                        key={chat.id}
                        className="rounded-lg hover:bg-accent/100 cursor-pointer flex justify-between items-center h-fit group/item p-2"
                        onClick={() => {
                          navigate(`/chat/${chat.id}`);
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                        role="button"
                      >
                        <span className="text-sm text-high-emphasis truncate block">
                          {chat.title}
                        </span>
                        <Button
                          variant="ghost"
                          className="w-fit h-fit p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHandler(chat.id);
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
