import type { VaultItem } from '../types/vault';

export const mockVaultItems: VaultItem[] = [
  {
    id: 'github',
    title: 'GitHub',
    url: 'https://github.com',
    username: 'pack.william',
    primaryPassword: 'github-primary-password',
    category: 'dev',
    updatedAt: 'Saved 2h ago',
    secondaryPasswords: [
      { id: 'recovery-code', note: 'Recovery code', value: 'gho_recovery_code' },
      { id: 'deploy-token', note: 'Deploy token', value: 'ghs_deploy_token' },
    ],
  },
  {
    id: 'stripe',
    title: 'Stripe',
    url: 'https://dashboard.stripe.com',
    username: 'finance@company.test',
    primaryPassword: 'stripe-primary-password',
    category: 'finance',
    updatedAt: 'Saved yesterday',
    secondaryPasswords: [{ id: 'api-backup', note: 'API backup', value: 'sk_backup_value' }],
  },
  {
    id: 'aws',
    title: 'AWS Console',
    url: 'https://console.aws.amazon.com',
    username: 'ops@company.test',
    primaryPassword: 'aws-primary-password',
    category: 'cloud',
    updatedAt: 'Saved 4d ago',
    secondaryPasswords: [],
  },
];
