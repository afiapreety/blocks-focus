import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui-kit/sidebar';
import { Button } from '@/components/ui-kit/button';
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui-kit/menubar';
import {
  LanguageSelector,
  ProfileMenu,
  AppSidebar,
  Notification,
  useGetNotifications,
} from '@/components/core';

type NotificationsData = {
  notifications: any[];
  unReadNotificationsCount: number;
  totalNotificationsCount: number;
};

export const MainLayout = () => {
  const { data: notificationsData } = useGetNotifications({
    Page: 0,
    PageSize: 10,
  });

  const notifications: NotificationsData = notificationsData ?? {
    notifications: [],
    unReadNotificationsCount: 0,
    totalNotificationsCount: 0,
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      <AppSidebar />

      <div className={`flex flex-1 flex-col  duration-300 ease-in-out`}>
        <div className="bg-card z-20 border-b py-2 px-4 sm:px-6 md:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <SidebarTrigger className="pl-0" />
          </div>
          <div className="flex justify-between items-center gap-1 sm:gap-3 md:gap-8">
            <Menubar className="border-none p-0">
              <MenubarMenu>
                <MenubarTrigger
                  asChild
                  className="cursor-pointer focus:bg-transparent data-[state=open]:bg-transparent p-0"
                >
                  <div className="relative">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                      <Bell className="!w-5 !h-5 text-medium-emphasis" />
                    </Button>
                    {notifications.unReadNotificationsCount > 0 && (
                      <div className="w-2 h-2 bg-error rounded-full absolute top-[13px] right-[20px]" />
                    )}
                  </div>
                </MenubarTrigger>
                <Notification />
              </MenubarMenu>
            </Menubar>
            <LanguageSelector />
            <ProfileMenu />
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-background p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
