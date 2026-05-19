export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  vault: '/vault',
  vaultUnlock: '/vault/unlock',
  itemDetail: '/items/:itemId',
  itemNew: '/items/new',
  itemEdit: '/items/:itemId/edit',
  generator: '/generator',
  auditLog: '/audit-log',
  settings: '/settings',
} as const;
