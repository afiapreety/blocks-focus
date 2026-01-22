import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui-kit/sidebar';
import { useTheme } from '@/styles/theme/theme-provider';
import { getSidebarStyle } from '@/lib/utils/sidebar-utils';
import { LogoSection } from '@/components/core';
import { ConfirmationModal } from '@/components/core/confirmation-modal/confirmation-modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui-kit/accordion';
import { Button } from '@/components/ui-kit/button';
import {
  MoreHorizontal,
  Pencil,
  PenSquare,
  Share2,
  Trash2,
  Download,
  Bookmark,
  Copy,
  Archive,
} from 'lucide-react';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const { data } = useGetConversations({
    limit: 200,
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
        session.conversation?.Title?.slice(0, 35) ||
        session.conversation?.Response?.slice(0, 35) ||
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
    setChatToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      if (chatId === chatToDelete) {
        navigate('/chat/new');
      }
      deleteMutateAsync({ session_id: chatToDelete, project_key: projectKey });
      setChatToDelete(null);
    }
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
        className={` h-full border-r border-border/50  ${isMobile ? 'mobile-sidebar' : ''}`}
        collapsible={isMobile ? 'none' : 'icon'}
        style={sidebarStyle}
      >
        <SidebarHeader className={`${!open && !isMobile ? 'border-b border-border/50' : ''} p-3`}>
          <LogoSection
            theme={theme}
            open={open}
            isMobile={isMobile}
            onClose={() => setOpenMobile(false)}
          />
        </SidebarHeader>

        <SidebarContent className="text-base px-3 py-4 text-high-emphasis font-normal overflow-x-hidden">
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="mt-2 mb-2 gap-2 justify-start bg-card"
          >
            <PenSquare className="h-4 w-4" />
            <span>{t('NEW_CHAT')}</span>
          </Button>
          <Accordion type="single" collapsible defaultValue="list">
            <AccordionItem value="list" className="border-none ">
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
                          className={`rounded-lg hover:bg-accent/100 cursor-pointer flex justify-between items-center h-fit group/item px-2 py-1 transition-colors ${
                            chatId === chat.id ? 'bg-accent/100' : ''
                          } ${openDropdownId === chat.id ? 'bg-accent/100' : ''}`}
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

                          <DropdownMenu
                            onOpenChange={(open) => setOpenDropdownId(open ? chat.id : null)}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-8 h-8 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-accent shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              className="w-44 p-1 rounded-md text-high-emphasis bg-card"
                              align="start"
                              side="right"
                              sideOffset={8}
                            >
                              <DropdownMenuItem
                                disabled
                                className="cursor-not-allowed opacity-50 px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Share2 className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('SHARE')}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled
                                className="cursor-not-allowed opacity-50 px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Download className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('DOWNLOAD')}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled
                                className="cursor-not-allowed opacity-50 px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Pencil className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('RENAME')}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled
                                className="cursor-not-allowed opacity-50 px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Bookmark className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('PIN')}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled
                                className="cursor-not-allowed opacity-50 px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Copy className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('CLONE')}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled
                                className="cursor-not-allowed opacity-50 px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Archive className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('ARCHIVE')}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer px-3 py-1.5 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHandler(chat.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                <span className="text-sm font-medium">{t('DELETE')}</span>
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

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title={t('DELETE_CHAT')}
        description={t('DELETE_CHAT_CONFIRMATION')}
        onConfirm={confirmDelete}
        confirmText="DELETE"
        cancelText="CANCEL"
      />
    </>
  );
};
