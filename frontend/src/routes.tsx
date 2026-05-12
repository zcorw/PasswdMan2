import { Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';

export const routes = {
  home: '/',
  login: '/login',
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
    </Routes>
  );
}
