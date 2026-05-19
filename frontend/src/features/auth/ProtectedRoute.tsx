import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { routes } from '../../routePaths';
import { useAuth } from './authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={routes.login} replace />;
  }

  return <>{children}</>;
}

