import { describe, expect, it } from 'vitest';

import routePathsSource from './routePaths.ts?raw';
import routesSource from './routes.tsx?raw';

describe('application routes', () => {
  it('keeps all MVP mobile pages registered in the route map', () => {
    [
      "login: '/login'",
      "register: '/register'",
      "vault: '/vault'",
      "vaultUnlock: '/vault/unlock'",
      "itemDetail: '/items/:itemId'",
      "itemNew: '/items/new'",
      "itemEdit: '/items/:itemId/edit'",
      "generator: '/generator'",
      "auditLog: '/audit-log'",
      "settings: '/settings'",
    ].forEach((routeDefinition) => {
      expect(routePathsSource).toContain(routeDefinition);
    });
  });

  it('uses parameterized item detail and edit routes for item navigation', () => {
    expect(routePathsSource).toContain("itemDetail: '/items/:itemId'");
    expect(routePathsSource).toContain("itemEdit: '/items/:itemId/edit'");
  });

  it('protects authenticated app routes and keeps auth entry routes public only', () => {
    expect(routesSource).toContain('PublicOnlyRoute');
    expect(routesSource).toContain('ProtectedRoute');
    expect(routesSource).toContain('VaultUnlockedRoute');
    expect(routesSource).toContain('<LoginPage />');
    expect(routesSource).toContain('<RegisterPage />');
    expect(routesSource).toContain('<VaultPage />');
    expect(routesSource).toContain('<VaultUnlockPage />');
    expect(routesSource).toContain('<ItemDetailPage />');
    expect(routesSource).toContain('<ItemFormPage />');
    expect(routesSource).toContain('<PasswordGeneratorPage />');
    expect(routesSource).toContain('<AuditLogPage />');
    expect(routesSource).toContain('<SettingsPage />');
  });
});
