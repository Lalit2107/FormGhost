/**
 * Zero-Knowledge Encryption Utility using Web Crypto API.
 * Uses AES-256-GCM for encryption/decryption, with keys derived via PBKDF2.
 */

// Generate a random initialization vector
const generateIv = () => crypto.getRandomValues(new Uint8Array(12));

// Derive an AES-GCM key from a user password
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptProfile(data: object, key: CryptoKey): Promise<{ ciphertext: string, iv: string }> {
  const enc = new TextEncoder();
  const encoded = enc.encode(JSON.stringify(data));
  const iv = generateIv();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Convert buffer to base64
  const ciphertextBytes = new Uint8Array(encryptedBuffer);
  const ciphertext = btoa(String.fromCharCode(...ciphertextBytes));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return { ciphertext, iv: ivBase64 };
}

export async function decryptProfile(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<object> {
  const ciphertextBytes = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertextBytes
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuffer));
  } catch (err) {
    throw new Error('Decryption failed. Incorrect password or corrupted data.');
  }
}
