import { Navigate, Route, Routes } from 'react-router-dom';

import { AuditLogPage } from './pages/AuditLogPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { LoginPage } from './pages/LoginPage';
import { PasswordGeneratorPage } from './pages/PasswordGeneratorPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { VaultPage } from './pages/VaultPage';
import { routes } from './routePaths';

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
      <Route path={routes.generator} element={<PasswordGeneratorPage />} />
      <Route path={routes.auditLog} element={<AuditLogPage />} />
      <Route path={routes.settings} element={<SettingsPage />} />
      <Route path="*" element={<Navigate to={routes.login} replace />} />
    </Routes>
  );
}
