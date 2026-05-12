import { describe, expect, it } from 'vitest';

import routesSource from './routes.tsx?raw';

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
      expect(routesSource).toContain(routeDefinition);
    });
  });

  it('uses parameterized item detail and edit routes for item navigation', () => {
    expect(routesSource).toContain("itemDetail: '/items/:itemId'");
    expect(routesSource).toContain("itemEdit: '/items/:itemId/edit'");
  });
});
