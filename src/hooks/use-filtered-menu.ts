/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
import { MenuItem } from '../models/sidebar';
import { useAuthStore } from '@/state/store/auth';

export const useFilteredMenu = (menuItems: MenuItem[]): MenuItem[] => {
  const { user, selectedOrgId } = useAuthStore();

  const hasRequiredRole = (requiredRoles: string[] | undefined): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!user) return false;

    // Get roles for the selected organization
    const membership = user.memberships?.find((m) => m.organizationId === selectedOrgId);
    const userRoles = membership?.roles || user.roles || [];

    // Check if user has any of the required roles
    return requiredRoles.some((role) => userRoles.includes(role));
  };

  const filterMenuItem = (item: MenuItem): MenuItem | null => {
    // Check if the item has role requirements
    if (!hasRequiredRole(item.roles)) {
      return null;
    }

    const filteredChildren = item.children
      ? (item.children.map(filterMenuItem).filter(Boolean) as MenuItem[])
      : undefined;

    return {
      ...item,
      children: filteredChildren,
    };
  };

  return useMemo(
    () => menuItems.map(filterMenuItem).filter(Boolean) as MenuItem[],
    [menuItems, user, selectedOrgId]
  );
};
