import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui-kit/sidebar';
import { useTheme } from '@/styles/theme/theme-provider';
import { useToast } from '@/hooks/use-toast';
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
  Copy,
  Archive,
  Loader,
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
  const { toast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const accordionContentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const chatListContainerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetConversations({
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
    if (!data?.pages) {
      return [];
    }

    const seenIds = new Set<string>();
    const allChats = data.pages.flatMap((page) => {
      return page.sessions
        .filter((session) => {
          if (seenIds.has(session.session_id)) {
            return false;
          }
          seenIds.add(session.session_id);
          return true;
        })
        .map((session) => ({
          id: session.session_id,
          lastEntryDate: session.last_entry_date,
          title:
            session.conversation?.Title?.slice(0, 35) ||
            session.conversation?.Response?.slice(0, 35) ||
            session.conversation?.Query ||
            '',
        }));
    });

    return allChats;
  }, [data?.pages]);

  const categorizedChats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const categorized = {
      today: [] as typeof chatList,
      yesterday: [] as typeof chatList,
      previous7Days: [] as typeof chatList,
      previous30Days: [] as typeof chatList,
      older: [] as typeof chatList,
    };

    const sorted = [...chatList].sort(
      (a, b) => new Date(b.lastEntryDate).getTime() - new Date(a.lastEntryDate).getTime()
    );

    sorted.forEach((chat) => {
      const chatDate = new Date(chat.lastEntryDate);
      const chatDateOnly = new Date(
        chatDate.getFullYear(),
        chatDate.getMonth(),
        chatDate.getDate()
      );

      if (chatDateOnly.getTime() === today.getTime()) {
        categorized.today.push(chat);
      } else if (chatDateOnly.getTime() === yesterday.getTime()) {
        categorized.yesterday.push(chat);
      } else if (chatDate >= sevenDaysAgo) {
        categorized.previous7Days.push(chat);
      } else if (chatDate >= thirtyDaysAgo) {
        categorized.previous30Days.push(chat);
      } else {
        categorized.older.push(chat);
      }
    });

    return categorized;
  }, [chatList]);

  useEffect(() => {
    if (isMobile && !openMobile) {
      return;
    }

    const setupObserver = () => {
      const currentLoadMoreRef = loadMoreRef.current;
      const scrollContainer = chatListContainerRef.current;

      if (!currentLoadMoreRef || !scrollContainer) {
        return null;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          });
        },
        {
          root: scrollContainer,
          rootMargin: '200px',
          threshold: 0.1,
        }
      );

      observer.observe(currentLoadMoreRef);
      return observer;
    };

    let observer = setupObserver();
    const timeouts: NodeJS.Timeout[] = [];

    if (!observer) {
      const delays = isMobile ? [100, 300, 500, 1000] : [100, 300];
      delays.forEach((delay) => {
        const timeout = setTimeout(() => {
          if (!observer) {
            observer = setupObserver();
          }
        }, delay);
        timeouts.push(timeout);
      });
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      timeouts.forEach(clearTimeout);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, chatList.length, isMobile, openMobile]);

  useEffect(() => {
    if (isMobile && !openMobile) {
      return;
    }

    const setupScrollListener = () => {
      const scrollContainer = chatListContainerRef.current;

      if (!scrollContainer) {
        return null;
      }

      const handleScroll = () => {
        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.75 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      };

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    };

    let cleanup = setupScrollListener();
    const timeouts: NodeJS.Timeout[] = [];

    if (!cleanup) {
      const delays = isMobile ? [100, 300, 500, 1000] : [100, 300];
      delays.forEach((delay) => {
        const timeout = setTimeout(() => {
          if (!cleanup) {
            cleanup = setupScrollListener();
          }
        }, delay);
        timeouts.push(timeout);
      });
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
      timeouts.forEach(clearTimeout);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isMobile, openMobile]);

  const handleNewChat = () => {
    navigate('/chat');
  };

  const deleteHandler = (id: string) => {
    setChatToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (chatToDelete) {
      try {
        const shouldNavigate = chatId === chatToDelete;
        await deleteMutateAsync({ session_id: chatToDelete, project_key: projectKey });

        if (shouldNavigate) {
          navigate('/chat');
        }

        setChatToDelete(null);
        setShowDeleteModal(false);
        toast({
          title: t('SUCCESS'),
          description: t('CHAT_DELETED_SUCCESSFULLY'),
        });
      } catch (error) {
        toast({
          title: t('ERROR'),
          description: t('FAILED_TO_DELETE_CHAT'),
          variant: 'destructive',
        });
      }
    }
  };

  const renderChatItem = (chat: (typeof chatList)[0]) => (
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
      <span className="text-sm text-high-emphasis truncate block flex-1 pr-2">{chat.title}</span>

      <DropdownMenu onOpenChange={(open) => setOpenDropdownId(open ? chat.id : null)}>
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
  );

  if (isMobile && !openMobile) {
    return null;
  }

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
            className="mt-2 mb-4 gap-2 justify-start bg-card"
          >
            <PenSquare className="h-4 w-4" />
            <span>{t('NEW_CHAT')}</span>
          </Button>

          <Accordion type="single" collapsible defaultValue="list">
            <AccordionItem value="list" className="border-none">
              <AccordionTrigger className="hover:no-underline justify-start gap-1 px-2 [&[data-state=closed]>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>{t('YOUR_CHATS')}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {chatList.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="overflow-visible" ref={accordionContentRef}>
                {chatList.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2 px-2">
                    {t('NO_CHATS_AVAILABLE')}
                  </p>
                ) : (
                  <>
                    <div
                      ref={chatListContainerRef}
                      className="overflow-y-auto overflow-x-visible pr-1 space-y-6 mt-2"
                      style={{ maxHeight: 'calc(100vh - 280px)' }}
                    >
                      
                      {categorizedChats.today.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            {t('TODAY')}
                          </h3>
                          <div className="space-y-1">
                            {categorizedChats.today.map((chat) => renderChatItem(chat))}
                          </div>
                        </div>
                      )}

                      
                      {categorizedChats.yesterday.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            {t('YESTERDAY')}
                          </h3>
                          <div className="space-y-1">
                            {categorizedChats.yesterday.map((chat) => renderChatItem(chat))}
                          </div>
                        </div>
                      )}

                      
                      {categorizedChats.previous7Days.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            {t('PREVIOUS_7_DAYS')}
                          </h3>
                          <div className="space-y-1">
                            {categorizedChats.previous7Days.map((chat) => renderChatItem(chat))}
                          </div>
                        </div>
                      )}

                      
                      {categorizedChats.previous30Days.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            {t('PREVIOUS_30_DAYS')}
                          </h3>
                          <div className="space-y-1">
                            {categorizedChats.previous30Days.map((chat) => renderChatItem(chat))}
                          </div>
                        </div>
                      )}

                      
                      {categorizedChats.older.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                            {t('OLDER')}
                          </h3>
                          <div className="space-y-1">
                            {categorizedChats.older.map((chat) => renderChatItem(chat))}
                          </div>
                        </div>
                      )}

                      
                      {hasNextPage && <div ref={loadMoreRef} className="h-20 w-full" />}
                    </div>

                    
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center py-4 mt-2">
                        <Loader className="w-5 h-5 text-muted-foreground animate-spin" />
                      </div>
                    )}
                  </>
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
