import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { PublicOnlyRoute } from './features/auth/PublicOnlyRoute';
import { VaultUnlockedRoute } from './features/vault/VaultUnlockedRoute';
import { AuditLogPage } from './pages/AuditLogPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { LoginPage } from './pages/LoginPage';
import { PasswordGeneratorPage } from './pages/PasswordGeneratorPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { VaultUnlockPage } from './pages/VaultUnlockPage';
import { VaultPage } from './pages/VaultPage';
import { routes } from './routePaths';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={routes.home} element={<Navigate to={routes.login} replace />} />
      <Route
        path={routes.login}
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path={routes.register}
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path={routes.vault}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <VaultPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.vaultUnlock}
        element={
          <ProtectedRoute>
            <VaultUnlockPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.itemNew}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <ItemFormPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.itemDetail}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <ItemDetailPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.itemEdit}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <ItemFormPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.generator}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <PasswordGeneratorPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.auditLog}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <AuditLogPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.settings}
        element={
          <ProtectedRoute>
            <VaultUnlockedRoute>
              <SettingsPage />
            </VaultUnlockedRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={routes.login} replace />} />
    </Routes>
  );
}
