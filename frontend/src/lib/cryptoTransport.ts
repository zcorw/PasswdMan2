import { gcm } from '@noble/ciphers/aes';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';

export const TRANSPORT_ALGORITHM = 'X25519+AES-GCM';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const HKDF_INFO = utf8ToBytes('PasswdMan2 encrypted transport v1');

export interface ServerPublicKey {
  keyId: string;
  algorithm: typeof TRANSPORT_ALGORITHM;
  publicKey: string;
  expiresAt: string;
}

export interface EncryptedEnvelope {
  algorithm: typeof TRANSPORT_ALGORITHM;
  keyId: string;
  nonce: string;
  timestamp: string;
  clientPublicKey: string;
  ciphertext: string;
}

export interface EncryptedResponseEnvelope {
  algorithm: typeof TRANSPORT_ALGORITHM;
  keyId: string;
  nonce: string;
  timestamp: string;
  ciphertext: string;
}

export interface ClientKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export function createClientKeyPair(): ClientKeyPair {
  const privateKey = x25519.utils.randomPrivateKey();
  return {
    privateKey,
    publicKey: x25519.getPublicKey(privateKey),
  };
}

export function encryptPayload(
  serverKey: ServerPublicKey,
  payload: unknown,
  keyPair = createClientKeyPair(),
): EncryptedEnvelope {
  if (serverKey.algorithm !== TRANSPORT_ALGORITHM) {
    throw new Error('Unsupported encrypted transport algorithm');
  }

  const timestamp = new Date().toISOString();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const sharedSecret = x25519.getSharedSecret(keyPair.privateKey, base64ToBytes(serverKey.publicKey));
  const aesKey = deriveAesKey(sharedSecret);
  const plaintext = utf8ToBytes(JSON.stringify(payload));
  const ciphertext = gcm(aesKey, nonce, additionalData(serverKey.algorithm, serverKey.keyId, timestamp)).encrypt(
    plaintext,
  );

  return {
    algorithm: TRANSPORT_ALGORITHM,
    keyId: serverKey.keyId,
    nonce: bytesToBase64(nonce),
    timestamp,
    clientPublicKey: bytesToBase64(keyPair.publicKey),
    ciphertext: bytesToBase64(ciphertext),
  };
}

export function decryptResponse<T>(
  serverKey: ServerPublicKey,
  keyPair: ClientKeyPair,
  envelope: EncryptedResponseEnvelope,
): T {
  if (envelope.algorithm !== TRANSPORT_ALGORITHM || envelope.keyId !== serverKey.keyId) {
    throw new Error('Unexpected encrypted response metadata');
  }

  const sharedSecret = x25519.getSharedSecret(keyPair.privateKey, base64ToBytes(serverKey.publicKey));
  const aesKey = deriveAesKey(sharedSecret);
  const plaintext = gcm(
    aesKey,
    base64ToBytes(envelope.nonce),
    additionalData(envelope.algorithm, envelope.keyId, envelope.timestamp),
  ).decrypt(base64ToBytes(envelope.ciphertext));

  return JSON.parse(bytesToUtf8(plaintext)) as T;
}

function deriveAesKey(sharedSecret: Uint8Array): Uint8Array {
  return hkdf(sha256, sharedSecret, undefined, HKDF_INFO, 32);
}

function additionalData(algorithm: string, keyId: string, timestamp: string): Uint8Array {
  return utf8ToBytes(`${algorithm}|${keyId}|${timestamp}`);
}

function utf8ToBytes(value: string): Uint8Array {
  return textEncoder.encode(value);
}

function bytesToUtf8(value: Uint8Array): string {
  return textDecoder.decode(value);
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
