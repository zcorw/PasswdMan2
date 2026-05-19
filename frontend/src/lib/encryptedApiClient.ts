import { apiRequest, ApiClientError } from './apiClient';
import {
  encryptPayload,
  TRANSPORT_ALGORITHM,
  type EncryptedEnvelope,
  type ServerPublicKey,
} from './cryptoTransport';
import type { ApiRequestOptions } from './apiTypes';

const SERVER_PUBLIC_KEY_PATH = '/api/crypto/server-public-key';

let cachedServerKey: ServerPublicKey | null = null;

interface EncryptedRequestOptions extends Omit<ApiRequestOptions, 'body'> {
  retryOnExpiredKey?: boolean;
}

export async function getServerPublicKey(): Promise<ServerPublicKey> {
  if (cachedServerKey && !isServerKeyExpired(cachedServerKey)) {
    return cachedServerKey;
  }

  cachedServerKey = await apiRequest<ServerPublicKey>(SERVER_PUBLIC_KEY_PATH);
  if (cachedServerKey.algorithm !== TRANSPORT_ALGORITHM) {
    throw new Error('Unsupported encrypted transport algorithm');
  }
  return cachedServerKey;
}

export function clearServerPublicKeyCache(): void {
  cachedServerKey = null;
}

export async function encryptedApiRequest<T>(
  path: string,
  payload: unknown,
  options: EncryptedRequestOptions = {},
): Promise<T> {
  const { retryOnExpiredKey = true, ...requestOptions } = options;

  try {
    return await sendEncryptedRequest<T>(path, payload, requestOptions);
  } catch (error) {
    if (retryOnExpiredKey && isExpiredServerKeyError(error)) {
      clearServerPublicKeyCache();
      return sendEncryptedRequest<T>(path, payload, requestOptions);
    }
    throw error;
  }
}

export function encryptedPost<T>(
  path: string,
  payload: unknown,
  options: EncryptedRequestOptions = {},
): Promise<T> {
  return encryptedApiRequest<T>(path, payload, { ...options, method: 'POST' });
}

export function encryptedPatch<T>(
  path: string,
  payload: unknown,
  options: EncryptedRequestOptions = {},
): Promise<T> {
  return encryptedApiRequest<T>(path, payload, { ...options, method: 'PATCH' });
}

async function sendEncryptedRequest<T>(
  path: string,
  payload: unknown,
  options: Omit<EncryptedRequestOptions, 'retryOnExpiredKey'>,
): Promise<T> {
  const serverKey = await getServerPublicKey();
  const encryptedEnvelope: EncryptedEnvelope = encryptPayload(serverKey, payload);
  return apiRequest<T>(path, {
    ...options,
    body: encryptedEnvelope,
    method: options.method ?? 'POST',
  });
}

function isServerKeyExpired(serverKey: ServerPublicKey): boolean {
  return new Date(serverKey.expiresAt).getTime() <= Date.now();
}

function isExpiredServerKeyError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === 'INVALID_KEY_ID';
}

