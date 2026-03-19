import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Info, Languages, LogOut, Moon, Shield, Sun, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';
import { useSignoutMutation } from '@/modules/auth/hooks/use-auth';
import { useAuthStore } from '@/state/store/auth';
import DummyProfile from '@/assets/images/dummy_profile.png';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { useTheme } from '@/styles/theme/theme-provider';
import { useGetAccount } from '@/modules/profile/hooks/use-account';
import { useLanguageContext } from '@/i18n/language-context';
import { Button } from '@/components/ui-kit/button';
import { decodeJWT } from '@/lib/utils/decode-jwt-utils';
import { useGetMultiOrgs } from '@/lib/api/hooks/use-multi-orgs';

/**
 * ProfileMenu Component
 *
 * A user profile dropdown menu component that displays user information and provides
 * navigation and account management options.
 *
 * Features:
 * - Displays user profile image and name
 * - Shows loading states with skeleton placeholders
 * - Provides navigation to profile page
 * - Includes theme toggling functionality
 * - Handles user logout with authentication state management
 * - Responsive design with different spacing for mobile and desktop
 *
 * Dependencies:
 * - Requires useTheme hook for theme management
 * - Requires useAuthStore for authentication state management
 * - Requires useSignoutMutation for API logout functionality
 * - Requires useGetAccount for fetching user account data
 * - Uses DropdownMenu components for the menu interface
 * - Uses React Router's useNavigate for navigation
 *
 * @example
 * // Basic usage in a header or navigation component
 * <ProfileMenu />
 */
const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';

export const ProfileMenu = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { logout, accessToken } = useAuthStore();
  const { mutateAsync } = useSignoutMutation();
  const navigate = useNavigate();
  const { data, isLoading } = useGetAccount();
  const {
    currentLanguage,
    setLanguage,
    availableLanguages,
    isLoading: isLoadingLangs,
  } = useLanguageContext();

  const currentOrgId = useMemo(() => {
    if (!accessToken) return null;
    const decoded = decodeJWT(accessToken);
    return decoded?.org_id ?? null;
  }, [accessToken]);

  const currentOrgRoles = useMemo(() => {
    if (!data?.memberships?.length || !currentOrgId) return [];
    const membership = data.memberships.find((m) => m.organizationId === currentOrgId);
    return membership?.roles ?? [];
  }, [data, currentOrgId]);

  const { data: orgsData } = useGetMultiOrgs({
    ProjectKey: projectKey,
    Page: 0,
    PageSize: 10,
  });

  const currentOrgName = useMemo(() => {
    if (!currentOrgId || !orgsData?.organizations) return null;
    const org = orgsData.organizations.find((org) => org.itemId === currentOrgId);
    return org?.name ?? null;
  }, [currentOrgId, orgsData]);

  const signoutHandler = async () => {
    try {
      const res = await mutateAsync();
      if (res.isSuccess) {
        logout();
        navigate('/login');
      }
    } catch (_error) {
      /* empty */
    }
  };

  const fullName = `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim() || 'User';
  const email = data?.email ?? '';

  const translatedOrgRoles = currentOrgRoles
    .map((role: string) => {
      const roleKey = role.toUpperCase();
      return t(roleKey);
    })
    .join(', ');

  useEffect(() => {
    if (data) {
      localStorage.setItem(
        'userProfile',
        JSON.stringify({
          fullName,
          profileImageUrl: data.profileImageUrl || DummyProfile,
        })
      );
    }
  }, [data, fullName]);

  const changeLanguage = async (newLanguageCode: string) => {
    await setLanguage(newLanguageCode);
    setIsDropdownOpen(false);
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-2 gap-2 border-none focus-visible:ring-0">
          <div className="relative h-7 w-7 rounded-full overflow-hidden">
            {isLoading ? (
              <Skeleton className="h-7 w-7 rounded-full" />
            ) : (
              <img
                src={data?.profileImageUrl || DummyProfile}
                alt={fullName}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="hidden md:flex flex-col items-start">
            {isLoading ? (
              <Skeleton className="w-20 h-3.5" />
            ) : (
              <span className="text-sm font-medium text-high-emphasis max-w-[100px] truncate">
                {fullName}
              </span>
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-medium-emphasis opacity-50 hidden md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="relative h-10 w-10 rounded-full border-2  overflow-hidden">
            <img
              src={data?.profileImageUrl || DummyProfile}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-sm font-semibold text-high-emphasis truncate">{fullName}</p>
            <p className="text-xs text-low-emphasis truncate">{email}</p>
            {translatedOrgRoles && (
              <div className="flex items-center gap-1 mt-1">
                <p className="text-[10px] text-medium-emphasis capitalize truncate">
                  {translatedOrgRoles}
                </p>
                {currentOrgName && (
                  <span className="text-[10px] text-low-emphasis">• {currentOrgName}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('profile')} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          {t('MY_PROFILE')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Language Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 mr-2" />
                <span>{t('LANGUAGE')}</span>
              </div>
              <span className="text-xs text-medium-emphasis">
                {availableLanguages?.find((lang) => lang.languageCode === currentLanguage)
                  ?.languageName || currentLanguage}
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {isLoadingLangs ? (
              <DropdownMenuItem disabled>
                <Skeleton className="h-4 w-24" />
              </DropdownMenuItem>
            ) : (
              availableLanguages?.map((lang) => (
                <DropdownMenuItem
                  key={lang.itemId}
                  onClick={() => changeLanguage(lang.languageCode)}
                  className="cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {lang.languageCode === currentLanguage && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <span className={lang.languageCode !== currentLanguage ? 'ml-6' : ''}>
                      {lang.languageName}
                    </span>
                    {lang.isDefault && (
                      <span className="ml-auto text-xs text-medium-emphasis">(Default)</span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Theme Toggle */}
        <DropdownMenuItem
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {t('THEME')}
          <span className="ml-auto text-xs text-medium-emphasis capitalize">{theme}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <Info className="h-4 w-4 mr-2" />
          {t('ABOUT')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open('https://selisegroup.com/privacy-policy/', '_blank')}
          className="cursor-pointer"
        >
          <Shield className="h-4 w-4 mr-2" />
          {t('PRIVACY_POLICY')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={signoutHandler}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('LOG_OUT')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
