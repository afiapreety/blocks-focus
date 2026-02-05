import { Outlet, useLocation } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui-kit/sidebar';
import { ProfileMenu, AppSidebar } from '@/components/core';
import { OrgSwitcher } from '@/components/core/org-switcher/org-switcher';

export const MainLayout = () => {
  const { open, isMobile } = useSidebar();
  const { pathname } = useLocation();
  const segments = pathname?.split('/').filter(Boolean);
  const firstSegment = segments?.[0] ?? undefined;
  const isEmailRoute = firstSegment === 'mail';
  const isChatRoute = firstSegment === 'chat';

  const getMarginClass = () => {
    if (isMobile) return 'ml-0';
    return open ? 'ml-[var(--sidebar-width)]' : 'ml-16';
  };

  const marginClass = getMarginClass();

  return (
    <div className="flex w-full min-h-screen relative">
      <div className="absolute left-0 top-0 h-full">
        <AppSidebar />
      </div>

      <div
        className={`flex flex-col w-full h-full ${marginClass} transition-[margin-left] duration-300 ease-in-out`}
      >
        <header className="sticky bg-sidebar/95 backdrop-blur-sm supports-[backdrop-filter]:bg-sidebar/60 z-20 top-0 border-b border-border/40">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 md:px-8 gap-4">
            <div className="flex items-center gap-2">
              {isMobile && <SidebarTrigger className="p-0" />}
            </div>

            <div className="flex items-center gap-1">
              <OrgSwitcher />
              <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />
              <ProfileMenu />
            </div>
          </div>
        </header>

        <div
          className={`flex h-full bg-surface ${
            !isEmailRoute && !isChatRoute && 'p-4 sm:p-6 md:p-8'
          } ${open && !isMobile ? 'w-[calc(100dvw-var(--sidebar-width))]' : 'w-full'}`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};
