/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Crypto API implementation for AES-GCM 256-bit End-to-End Encryption

const DEFAULT_ORG_SALT = 'GA_OPS_SECURE_VAULT_SALT_2026';

/**
 * Derives a 256-bit AES-GCM CryptoKey from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, saltStr: string = DEFAULT_ORG_SALT): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltStr),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-GCM 256-bit
 * Returns JSON containing base64 iv and ciphertext
 */
export async function encryptData(plainText: string, passphrase: string = 'GA_ENTERPRISE_SECURE_KEY_2026'): Promise<string> {
  try {
    const key = await deriveKey(passphrase);
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoder.encode(plainText)
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

    return JSON.stringify({
      algo: 'AES-GCM-256',
      iv: ivBase64,
      data: cipherBase64,
      v: 1,
    });
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Gagal mengenkripsi data aset.');
  }
}

/**
 * Decrypts AES-GCM 256-bit encrypted payload back to plaintext
 */
export async function decryptData(encryptedPayload: string, passphrase: string = 'GA_ENTERPRISE_SECURE_KEY_2026'): Promise<string> {
  try {
    const parsed = JSON.parse(encryptedPayload);
    if (!parsed.iv || !parsed.data) {
      throw new Error('Format enkripsi tidak valid');
    }

    const key = await deriveKey(passphrase);
    const iv = new Uint8Array(atob(parsed.iv).split('').map((c) => c.charCodeAt(0)));
    const cipherBytes = new Uint8Array(atob(parsed.data).split('').map((c) => c.charCodeAt(0)));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      cipherBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Gagal mendekripsi data. Kunci pengaman tidak cocok.');
  }
}

/**
 * Computes SHA-256 Hex Hash for integrity checksum
 */
export async function computeChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates secure master encryption key fingerprint
 */
export async function getKeyFingerprint(passphrase: string = 'GA_ENTERPRISE_SECURE_KEY_2026'): Promise<string> {
  const fullHash = await computeChecksum(passphrase + DEFAULT_ORG_SALT);
  return `E2EE-${fullHash.substring(0, 4).toUpperCase()}-${fullHash.substring(4, 8).toUpperCase()}-${fullHash.substring(8, 12).toUpperCase()}`;
}
