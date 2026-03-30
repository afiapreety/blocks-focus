import { Routes, Route, Navigate } from 'react-router-dom';

import { NotFoundPage, ServiceUnavailablePage } from '@/modules/error-view';

import { ProfilePage } from '@/modules/profile';
import { MainLayout } from '@/layout/main-layout/main-layout';
import { AuthRoutes } from './auth.route';
import { Guard } from '@/state/store/auth/guard';
import { ClientMiddleware } from '@/state/client-middleware';
import { ThemeProvider } from '@/styles/theme/theme-provider';
import { SidebarProvider } from '@/components/ui-kit/sidebar';
import { Toaster } from '@/components/ui-kit/toaster';
import { useLanguageContext } from '@/i18n/language-context';
import { LoadingOverlay } from '@/components/core';
import { ProtectedRoute } from '@/state/store/auth/protected-route';
import { UsersTablePage } from '@/modules/iam';
import { CreateNotePage, EditNotePage, NotesPage } from '@/modules/notes';

export const AppRoutes = () => {
  const { isLoading } = useLanguageContext();

  if (isLoading) {
    return <LoadingOverlay />;
  }
  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <ClientMiddleware>
        <ThemeProvider>
          <SidebarProvider>
            <Routes>
              {AuthRoutes}
              <Route
                element={
                  <Guard>
                    <MainLayout />
                  </Guard>
                }
              >
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <UsersTablePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />

                <Route path="/notes" element={<NotesPage />} />
                <Route path="/notes/create" element={<CreateNotePage />} />
                <Route path="/notes/:noteId" element={<EditNotePage />} />

                <Route path="/503" element={<ServiceUnavailablePage />} />
                <Route path="/404" element={<NotFoundPage />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/notes" />} />

              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </SidebarProvider>
        </ThemeProvider>
      </ClientMiddleware>
      <Toaster />
    </div>
  );
};
