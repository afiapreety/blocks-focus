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
import { MoreHorizontal, PenSquare, Trash } from 'lucide-react';
import {
  useDeleteConversationById,
  useGetConversations,
} from '@/modules/gpt-chats/hooks/use-conversation-api';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';

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
        session.conversation?.Title?.slice(0, 30) ||
        session.conversation?.Response?.slice(0, 30) ||
        session.conversation?.Query ||
        '',
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
    <>
      {isMobile && openMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setOpenMobile(false)}
        />
      )}
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
            variant="outline"
            className="mt-2 mb-2 gap-2 justify-start"
          >
            <PenSquare className="h-4 w-4" />
            <span>{t('NEW_CHAT')}</span>
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
                          className="rounded-lg hover:bg-accent/100 cursor-pointer flex justify-between items-center h-fit group/item p-2 transition-colors"
                          onClick={() => {
                            navigate(`/chat/${chat.id}`);
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                          role="button"
                        >
                          <span className="text-sm text-high-emphasis truncate block flex-1 pr-2">
                            {chat.title}
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-8 h-8 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="right" className="w-40">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHandler(chat.id);
                                }}
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                {t('DELETE')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SidebarContent>
      </Sidebar>
    </>
  );
};
