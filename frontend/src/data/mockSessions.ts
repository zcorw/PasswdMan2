export interface ActiveSession {
  id: string;
  device: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export const mockSessions: ActiveSession[] = [
  {
    id: 'session-current',
    device: 'Mobile PWA',
    createdAt: 'Today',
    expiresAt: 'Tomorrow',
    current: true,
  },
  {
    id: 'session-tablet',
    device: 'Tablet browser',
    createdAt: 'Yesterday',
    expiresAt: 'Tomorrow',
    current: false,
  },
];
