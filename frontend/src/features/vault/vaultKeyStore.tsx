import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import {
  decryptVaultKey,
  encryptVaultKey,
  generateVaultKey,
} from '../../lib/vaultCrypto';
import { useAuth } from '../auth/authStore';
import type { VaultKeyState } from './vaultTypes';

export const VAULT_IDLE_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

const vaultActivityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

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

interface VaultIdleLockDelayParams {
  lastActivityAt: number;
  now: number;
  timeoutMs: number;
}

export function getVaultIdleLockDelay({
  lastActivityAt,
  now,
  timeoutMs,
}: VaultIdleLockDelayParams): number {
  return Math.max(timeoutMs - (now - lastActivityAt), 0);
}

export function hasVaultIdleTimedOut(params: VaultIdleLockDelayParams): boolean {
  return getVaultIdleLockDelay(params) === 0;
}

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
  const lastActivityAtRef = useRef(Date.now());

  const clearVaultKey = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      clearVaultKey();
    }
  }, [authStatus, clearVaultKey]);

  useEffect(() => {
    if (state.status !== 'unlocked') {
      return undefined;
    }

    let lockTimerId: number | undefined;

    function clearLockTimer() {
      if (lockTimerId !== undefined) {
        window.clearTimeout(lockTimerId);
        lockTimerId = undefined;
      }
    }

    function scheduleLockCheck() {
      clearLockTimer();
      const delay = getVaultIdleLockDelay({
        lastActivityAt: lastActivityAtRef.current,
        now: Date.now(),
        timeoutMs: VAULT_IDLE_LOCK_TIMEOUT_MS,
      });

      if (delay === 0) {
        clearVaultKey();
        return;
      }

      lockTimerId = window.setTimeout(scheduleLockCheck, delay);
    }

    function recordVaultActivity() {
      const now = Date.now();
      if (
        hasVaultIdleTimedOut({
          lastActivityAt: lastActivityAtRef.current,
          now,
          timeoutMs: VAULT_IDLE_LOCK_TIMEOUT_MS,
        })
      ) {
        clearVaultKey();
        return;
      }

      lastActivityAtRef.current = now;
      scheduleLockCheck();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        scheduleLockCheck();
      }
    }

    lastActivityAtRef.current = Date.now();
    scheduleLockCheck();
    vaultActivityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordVaultActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearLockTimer();
      vaultActivityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordVaultActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearVaultKey, state.status]);

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
