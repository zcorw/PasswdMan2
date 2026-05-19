import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { routes } from '../../routePaths';
import { useAuth } from './authStore';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return <Navigate to={routes.vault} replace />;
  }

  return <>{children}</>;
}

