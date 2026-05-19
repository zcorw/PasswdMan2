import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  decryptVaultKey,
  encryptVaultKey,
  generateVaultKey,
} from '../../lib/vaultCrypto';
import { useAuth } from '../auth/authStore';
import type { VaultKeyState } from './vaultTypes';

type VaultKeyAction =
  | { type: 'clear' }
  | { type: 'error'; error: string }
  | { type: 'unlocked'; encryptedVaultKey: string; vaultKey: Uint8Array };

interface VaultKeyContextValue extends VaultKeyState {
  clearVaultKey: () => void;
  createEncryptedVaultKey: (masterPassword: string) => Promise<string>;
  setUnlockedVaultKey: (vaultKey: Uint8Array, encryptedVaultKey: string) => void;
  unlockVaultKey: (masterPassword: string, encryptedVaultKey: string) => Promise<Uint8Array>;
}

const initialVaultKeyState: VaultKeyState = {
  encryptedVaultKey: null,
  error: null,
  status: 'locked',
  vaultKey: null,
};

const VaultKeyContext = createContext<VaultKeyContextValue | null>(null);

export function vaultKeyReducer(state: VaultKeyState, action: VaultKeyAction): VaultKeyState {
  switch (action.type) {
    case 'clear':
      return initialVaultKeyState;
    case 'error':
      return {
        encryptedVaultKey: null,
        error: action.error,
        status: 'locked',
        vaultKey: null,
      };
    case 'unlocked':
      return {
        encryptedVaultKey: action.encryptedVaultKey,
        error: null,
        status: 'unlocked',
        vaultKey: action.vaultKey,
      };
    default:
      return state;
  }
}

export function VaultKeyProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [state, dispatch] = useReducer(vaultKeyReducer, initialVaultKeyState);

  const clearVaultKey = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      clearVaultKey();
    }
  }, [authStatus, clearVaultKey]);

  const setUnlockedVaultKey = useCallback((vaultKey: Uint8Array, encryptedVaultKey: string) => {
    dispatch({ encryptedVaultKey, type: 'unlocked', vaultKey });
  }, []);

  const createEncryptedVaultKey = useCallback(async (masterPassword: string) => {
    try {
      const vaultKey = generateVaultKey();
      const encryptedVaultKey = await encryptVaultKey(masterPassword, vaultKey);
      dispatch({ encryptedVaultKey, type: 'unlocked', vaultKey });
      return encryptedVaultKey;
    } catch (error) {
      dispatch({ error: getVaultKeyErrorMessage(error), type: 'error' });
      throw error;
    }
  }, []);

  const unlockVaultKey = useCallback(async (masterPassword: string, encryptedVaultKey: string) => {
    try {
      const vaultKey = await decryptVaultKey(masterPassword, encryptedVaultKey);
      dispatch({ encryptedVaultKey, type: 'unlocked', vaultKey });
      return vaultKey;
    } catch (error) {
      dispatch({ error: getVaultKeyErrorMessage(error), type: 'error' });
      throw error;
    }
  }, []);

  const contextValue = useMemo<VaultKeyContextValue>(
    () => ({
      ...state,
      clearVaultKey,
      createEncryptedVaultKey,
      setUnlockedVaultKey,
      unlockVaultKey,
    }),
    [clearVaultKey, createEncryptedVaultKey, setUnlockedVaultKey, state, unlockVaultKey],
  );

  return <VaultKeyContext.Provider value={contextValue}>{children}</VaultKeyContext.Provider>;
}

export function useVaultKey(): VaultKeyContextValue {
  const context = useContext(VaultKeyContext);
  if (!context) {
    throw new Error('useVaultKey must be used within VaultKeyProvider');
  }
  return context;
}

function getVaultKeyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Vault Key operation failed';
}

