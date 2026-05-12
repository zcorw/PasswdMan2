import { Navigate, Route, Routes } from 'react-router-dom';

import { VaultItemsProvider } from './context/VaultItemsContext';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { RegisterPage } from './pages/RegisterPage';
import { VaultPage } from './pages/VaultPage';

export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  vault: '/vault',
  itemDetail: '/items/:itemId',
  itemNew: '/items/new',
  itemEdit: '/items/:itemId/edit',
  generator: '/generator',
  auditLog: '/audit-log',
  settings: '/settings',
  itemDetailPath: (itemId: string) => `/items/${itemId}`,
  itemEditPath: (itemId: string) => `/items/${itemId}/edit`,
} as const;

export function AppRoutes() {
  return (
    <VaultItemsProvider>
      <Routes>
        <Route path={routes.home} element={<Navigate to={routes.login} replace />} />
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />
        <Route path={routes.vault} element={<VaultPage />} />
        <Route path={routes.itemNew} element={<ItemFormPage />} />
        <Route path={routes.itemDetail} element={<ItemDetailPage />} />
        <Route path={routes.itemEdit} element={<ItemFormPage />} />
        <Route path={routes.generator} element={<PlaceholderPage title="Generator" />} />
        <Route path={routes.auditLog} element={<PlaceholderPage title="Audit log" />} />
        <Route path={routes.settings} element={<PlaceholderPage title="Settings" />} />
      </Routes>
    </VaultItemsProvider>
  );
}
