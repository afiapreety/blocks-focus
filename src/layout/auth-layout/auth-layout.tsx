import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // import bgAuthLight from '@/assets/images/bg_auth_light.svg';
// import bgAuthDark from '@/assets/images/bg_auth_dark.svg';
import { useGetLoginOptions } from '@/modules/auth/hooks/use-auth';
import { useAuthState } from '@/state/client-middleware';
import { useTheme } from '@/styles/theme/theme-provider';
import { LanguageSelector } from '@/components/core';
import { GeometricAnimation } from '@/components/ui-kit/geometric-animation';

export const AuthLayout = () => {
  const { isLoading, error: loginOptionsError } = useGetLoginOptions();
  const navigate = useNavigate();
  const { isMounted, isAuthenticated } = useAuthState();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    // Don't redirect if we're on the MFA verification page
    if (isAuthenticated && !window.location.pathname.includes('/verify-mfa')) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isMounted) return null;

  /** HTTP error structure for API responses */
  interface HttpError {
    message?: string;
    status?: number;
    response?: {
      status?: number;
    };
  }

  /** Checks for client configuration errors (403, 404, 406, 424) */
  const isClientConfigError = (error: HttpError | null | undefined): boolean => {
    if (!error) return false;
    
    const configErrorStatuses = [403, 404, 406, 424];
    
    // Check status from response or direct status
    const status = error.response?.status ?? error.status;
    if (status && configErrorStatuses.includes(status)) {
      return true;
    }

    // Check for HTTP status in message string
    if (error.message) {
      return configErrorStatuses.some((code) => error.message?.includes(`HTTP ${code}`));
    }

    return false;
  };

  /** Checks for server errors (5xx status codes) */
  const isServerError = (error: HttpError | null | undefined): boolean => {
    if (!error) return false;

    const status = error.response?.status ?? error.status;
    if (status && status >= 500 && status < 600) {
      return true;
    }

    if (error.message) {
      const httpMatch = error.message.match(/HTTP (\d{3})/);
      if (httpMatch) {
        const statusFromMessage = parseInt(httpMatch[1], 10);
        return statusFromMessage >= 500 && statusFromMessage < 600;
      }
    }

    return false;
  };

  const renderAuthContent = () => {
    if (isClientConfigError(loginOptionsError)) {
      return (
        <div className="w-full max-w-xl mx-auto">
          <div className="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent"></div>
            <div className="relative z-10">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-red-900 tracking-tight">
                  Incorrect Project Key
                </h2>
                <div className="space-y-3 text-red-700">
                  <p className="text-base leading-relaxed">
                    It seems your project is not set up in the Blocks Cloud.
                  </p>
                  <p className="text-sm leading-relaxed">
                    Please create a project at{' '}
                    <a
                      href="https://cloud.seliseblocks.com"
                      className="font-semibold underline decoration-red-400 underline-offset-2 hover:decoration-red-600 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      cloud.seliseblocks.com
                    </a>
                    , then update your{' '}
                    <code className="inline-flex items-center px-2 py-1 rounded-md bg-red-200/60 text-red-800 font-mono text-xs border border-red-300/50">
                      .env
                    </code>{' '}
                    configuration in Construct accordingly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isServerError(loginOptionsError)) {
      return (
        <div className="w-full max-w-xl mx-auto">
          <div className="relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 to-transparent"></div>
            <div className="relative z-10">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-orange-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-orange-900 tracking-tight">
                  Services Temporarily Unavailable
                </h2>
                <div className="space-y-3 text-orange-700">
                  <p className="text-base leading-relaxed">
                    The services are temporarily unavailable.
                  </p>
                  <p className="text-base leading-relaxed font-semibold">
                    Everything will be back to normal soon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <Outlet />;
  };

  if (isLoading) return null;

  return (
    <div className="flex w-full flex-col h-screen">
      <div className="flex w-full min-h-screen relative">
        <div className="hidden md:block w-[36%] relative bg-primary-50 dark:bg-zinc-800">
          <GeometricAnimation />
        </div>
        <div className="flex items-center justify-center w-full px-6 sm:px-20 md:w-[64%] md:px-[14%] lg:px-[16%] 2xl:px-[20%]">
          <div className="absolute top-2 right-4 flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full transition-colors hover:bg-accent"
              aria-label={t('THEME')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <LanguageSelector />
          </div>
          {renderAuthContent()}
        </div>
      </div>
    </div>
  );
};
