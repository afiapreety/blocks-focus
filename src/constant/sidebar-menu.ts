import { MenuItem } from '../models/sidebar';

const createMenuItem = (
  id: string,
  name: string,
  path: string,
  icon?: MenuItem['icon'],
  options: Partial<Omit<MenuItem, 'id' | 'name' | 'path' | 'icon'>> = {}
): MenuItem => ({
  id,
  name,
  path,
  icon,
  ...options,
});

export const menuItems: MenuItem[] = [
  createMenuItem('iam', 'Users', '/users', 'Users', {
    isIntegrated: true,
    roles: ['admin'],
  }),
];
