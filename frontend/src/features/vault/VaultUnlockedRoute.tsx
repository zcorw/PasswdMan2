import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { routes } from '../../routePaths';
import { useVaultKey } from './vaultKeyStore';

interface VaultUnlockedRouteProps {
  children: ReactNode;
}

export function VaultUnlockedRoute({ children }: VaultUnlockedRouteProps) {
  const { vaultKey } = useVaultKey();
  const location = useLocation();

  if (!vaultKey) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`${routes.vaultUnlock}?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}
