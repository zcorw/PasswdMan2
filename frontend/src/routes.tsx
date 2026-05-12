import { Navigate, Route, Routes } from 'react-router-dom';

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
} as const;

export function AppRoutes() {
  return (
    <Routes>
      <Route path={routes.home} element={<Navigate to={routes.login} replace />} />
      <Route path={routes.login} element={<LoginPage />} />
      <Route path={routes.register} element={<RegisterPage />} />
      <Route path={routes.vault} element={<VaultPage />} />
      <Route path={routes.itemNew} element={<ItemFormPage />} />
      <Route path={routes.itemDetail} element={<ItemDetailPage />} />
      <Route path={routes.itemEdit} element={<ItemFormPage />} />
      <Route
        path={routes.generator}
        element={<PlaceholderPage title="Generator" description="Password generator controls are planned for T012." />}
      />
      <Route
        path={routes.auditLog}
        element={<PlaceholderPage title="Log" description="Audit log entries are planned for T013." />}
      />
      <Route
        path={routes.settings}
        element={<PlaceholderPage title="Settings" description="Security settings are planned for T014." />}
      />
      <Route path="*" element={<Navigate to={routes.login} replace />} />
    </Routes>
  );
}
