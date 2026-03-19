import React from 'react';

/**
 * Computes the sidebar style based on the current state
 * @param isMobile Whether the device is mobile
 * @param open Whether the sidebar is open in desktop mode
 * @param openMobile Whether the sidebar is open in mobile mode
 * @returns CSS properties object for the sidebar
 */
export function getSidebarStyle(
  isMobile: boolean,
  open: boolean,
  openMobile: boolean
): React.CSSProperties {
  if (isMobile) {
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const width = isMobileScreen ? '100%' : 'min(80vw, 280px)';
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      width: width,
      height: '100%',
      maxWidth: isMobileScreen ? 'none' : '280px',
      zIndex: 50,
      borderRight: 'none',
      transition: 'transform 0.3s ease-in-out',
      transform: openMobile ? 'translateX(0)' : 'translateX(-100%)',
      overscrollBehavior: 'contain',
    };
  }

  return {
    width: open ? 'var(--sidebar-width)' : '64px',
    minWidth: open ? 'var(--sidebar-width)' : '64px',
    transition: 'width 0.3s ease, min-width 0.3s ease',
    height: '100%',
  };
}
