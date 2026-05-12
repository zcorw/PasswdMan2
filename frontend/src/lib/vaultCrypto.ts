import { gcm } from '@noble/ciphers/aes';
import { scryptAsync } from '@noble/hashes/scrypt';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const VAULT_KEY_BYTES = 32;
const NONCE_BYTES = 12;

export interface VaultKdfParams {
  algorithm: 'scrypt';
  salt: string;
  N: number;
  r: number;
  p: number;
  dkLen: number;
}

export interface EncryptedBlob {
  version: 1;
  algorithm: 'AES-GCM';
  nonce: string;
  ciphertext: string;
}

export interface EncryptedVaultKeyBlob extends EncryptedBlob {
  kdf: VaultKdfParams;
}

export interface SecondaryPasswordSecret {
  id: string;
  password: string;
  note: string;
  sortOrder: number;
}

export interface PasswordItemSecret {
  primaryPassword: string;
  secondaryPasswords: SecondaryPasswordSecret[];
  totpSecret?: string;
  secureNote?: string;
  customFields?: Array<Record<string, string>>;
}

export function createVaultKdfParams(): VaultKdfParams {
  return {
    algorithm: 'scrypt',
    salt: bytesToBase64(randomBytes(16)),
    N: 2 ** 15,
    r: 8,
    p: 1,
    dkLen: VAULT_KEY_BYTES,
  };
}

export function generateVaultKey(): Uint8Array {
  return randomBytes(VAULT_KEY_BYTES);
}

export async function encryptVaultKey(
  masterPassword: string,
  vaultKey: Uint8Array,
  kdf = createVaultKdfParams(),
): Promise<string> {
  assertVaultKey(vaultKey);
  const keyEncryptionKey = await deriveKeyEncryptionKey(masterPassword, kdf);
  return JSON.stringify({
    ...encryptBytes(keyEncryptionKey, vaultKey),
    kdf,
  } satisfies EncryptedVaultKeyBlob);
}

export async function decryptVaultKey(masterPassword: string, encryptedVaultKey: string): Promise<Uint8Array> {
  const envelope = parseEncryptedVaultKey(encryptedVaultKey);
  const keyEncryptionKey = await deriveKeyEncryptionKey(masterPassword, envelope.kdf);
  return decryptBytes(keyEncryptionKey, envelope);
}

export function encryptItemSecret(vaultKey: Uint8Array, secret: PasswordItemSecret): string {
  assertVaultKey(vaultKey);
  const plaintext = textEncoder.encode(JSON.stringify(secret));
  return JSON.stringify(encryptBytes(vaultKey, plaintext));
}

export function decryptItemSecret<T = PasswordItemSecret>(vaultKey: Uint8Array, encryptedSecret: string): T {
  assertVaultKey(vaultKey);
  const envelope = parseEncryptedBlob(encryptedSecret);
  const plaintext = decryptBytes(vaultKey, envelope);
  return JSON.parse(textDecoder.decode(plaintext)) as T;
}

async function deriveKeyEncryptionKey(masterPassword: string, params: VaultKdfParams): Promise<Uint8Array> {
  if (params.algorithm !== 'scrypt') {
    throw new Error('Unsupported vault KDF algorithm');
  }
  return scryptAsync(textEncoder.encode(masterPassword), base64ToBytes(params.salt), {
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
  });
}

function encryptBytes(key: Uint8Array, plaintext: Uint8Array): EncryptedBlob {
  const nonce = randomBytes(NONCE_BYTES);
  const ciphertext = gcm(key, nonce).encrypt(plaintext);
  return {
    version: 1,
    algorithm: 'AES-GCM',
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertext),
  };
}

function decryptBytes(key: Uint8Array, envelope: EncryptedBlob): Uint8Array {
  if (envelope.version !== 1 || envelope.algorithm !== 'AES-GCM') {
    throw new Error('Unsupported encrypted vault data');
  }
  return gcm(key, base64ToBytes(envelope.nonce)).decrypt(base64ToBytes(envelope.ciphertext));
}

function parseEncryptedVaultKey(value: string): EncryptedVaultKeyBlob {
  const parsed = JSON.parse(value) as EncryptedVaultKeyBlob;
  if (!parsed.kdf) {
    throw new Error('Encrypted Vault Key is missing KDF metadata');
  }
  return parsed;
}

function parseEncryptedBlob(value: string): EncryptedBlob {
  return JSON.parse(value) as EncryptedBlob;
}

function assertVaultKey(vaultKey: Uint8Array): void {
  if (vaultKey.length !== VAULT_KEY_BYTES) {
    throw new Error('Vault Key must be 32 bytes');
  }
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
