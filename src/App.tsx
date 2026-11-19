import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PomodoroProvider } from '@/context/PomodoroContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ToastHost } from '@/components/ui/Toast';
import { AdminPage } from '@/pages/AdminPage';
import { CreditsPoliciesPage } from '@/pages/CreditsPoliciesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FriendsPage } from '@/pages/FriendsPage';
import { InfoFeedbackPage } from '@/pages/InfoFeedbackPage';
import { LandingAuthPage } from '@/pages/LandingAuthPage';
import { RoomPage } from '@/pages/RoomPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ShopPage } from '@/pages/ShopPage';

function AuthedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PageContainer>{children}</PageContainer>
    </ProtectedRoute>
  );
}

// "/" shows the dashboard for signed-in players, the landing/auth page otherwise.
function HomePage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="flex flex-col items-center gap-3 text-charcoal/60">
          <Coffee className="h-8 w-8 animate-pulse" />
          <p className="text-sm font-medium">Warming up your mug...</p>
        </div>
      </div>
    );
  }

  if (profile) {
    return (
      <PageContainer>
        <DashboardPage />
      </PageContainer>
    );
  }

  return <LandingAuthPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PomodoroProvider>
          <SettingsProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/room/:roomId"
                element={
                  <AuthedPage>
                    <RoomPage />
                  </AuthedPage>
                }
              />
              <Route
                path="/friends"
                element={
                  <AuthedPage>
                    <FriendsPage />
                  </AuthedPage>
                }
              />
              <Route
                path="/shop"
                element={
                  <AuthedPage>
                    <ShopPage />
                  </AuthedPage>
                }
              />
              <Route
                path="/settings"
                element={
                  <AuthedPage>
                    <SettingsPage />
                  </AuthedPage>
                }
              />
              <Route
                path="/admin"
                element={
                  <AuthedPage>
                    <AdminPage />
                  </AuthedPage>
                }
              />
              <Route
                path="/info"
                element={
                  <AuthedPage>
                    <InfoFeedbackPage />
                  </AuthedPage>
                }
              />
              <Route
                path="/credits"
                element={
                  <AuthedPage>
                    <CreditsPoliciesPage />
                  </AuthedPage>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastHost />
          </SettingsProvider>
        </PomodoroProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
