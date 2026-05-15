import { describe, expect, it } from 'vitest';

import routePathsSource from './routePaths.ts?raw';

describe('application routes', () => {
  it('keeps all MVP mobile pages registered in the route map', () => {
    [
      "login: '/login'",
      "register: '/register'",
      "vault: '/vault'",
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
});
