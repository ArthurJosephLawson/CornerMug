import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

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

  if (!profile) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
