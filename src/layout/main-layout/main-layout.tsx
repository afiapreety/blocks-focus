import { Outlet, useLocation } from 'react-router-dom';
import { useSidebar } from '@/components/ui-kit/sidebar';
import { Menubar, MenubarMenu } from '@/components/ui-kit/menubar';
import { LanguageSelector, ProfileMenu, AppSidebar } from '@/components/core';

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
        className={`flex flex-col w-full h-full ${
          marginClass
        } transition-[margin-left] duration-300 ease-in-out`}
      >
        <div className="sticky bg-card z-20 top-0 border-b py-2 px-4 sm:px-6 md:px-8 flex justify-between items-center w-full">
          <div className="flex items-center"></div>
          <div className="flex justify-between items-center gap-1 sm:gap-3 md:gap-8">
            <Menubar className="border-none p-0">
              <MenubarMenu></MenubarMenu>
            </Menubar>
            <LanguageSelector />
            <ProfileMenu />
          </div>
        </div>
        <div
          className={`flex h-full bg-surface ${!isEmailRoute && !isChatRoute && 'p-4 sm:p-6 md:p-8'} ${open && !isMobile ? 'w-[calc(100dvw-var(--sidebar-width))]' : 'w-full'}`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};
