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
