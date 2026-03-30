import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui-kit/sidebar';
import { useTheme } from '@/styles/theme/theme-provider';
import { getSidebarStyle } from '@/lib/utils/sidebar-utils';
import { LogoSection } from '@/components/core';
import { menuItems } from '@/constant/sidebar-menu';
import { MenuIcon } from '@/components/core/menu-icon/menu-icon';
import { useFilteredMenu } from '@/hooks/use-filtered-menu';
import { Button } from '@/components/ui-kit/button';
import { useTranslation } from 'react-i18next';

export const AppSidebar = () => {
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const { setOpenMobile, open, isMobile, openMobile } = useSidebar();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const filteredMenuItems = useFilteredMenu(menuItems);

  useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile, isMobile]);

  const sidebarStyle = getSidebarStyle(isMobile, open, openMobile);

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
        className={`h-full border-r border-border/50 w-full sm:w-auto ${isMobile ? 'mobile-sidebar' : ''}`}
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

        <SidebarContent className="text-base px-3 py-2 text-high-emphasis font-normal overflow-x-hidden">
          <div className="mt-4">
            {filteredMenuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
                variant="ghost"
                className={`justify-start hover:bg-accent/50 mb-2 px-3 w-full ${
                  pathname === item.path ? 'bg-accent/50' : ''
                }`}
              >
                {item.icon && <MenuIcon name={item.icon} className="h-5 w-5" />}
                <span className="font-normal">{t(item.name)}</span>
              </Button>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  );
};
