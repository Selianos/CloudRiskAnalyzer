import crypto from 'crypto';

/**
 * Encrypts a plaintext string into a Fernet-compatible token.
 * Fernet is a specific cryptographic format using AES-128-CBC and HMAC-SHA256.
 * 
 * @param {string} plaintext - The plaintext string to encrypt (usually JSON stringified credentials)
 * @param {string} keyBase64 - The 32-byte secret key, base64url or base64 encoded
 * @returns {string} The base64url-encoded Fernet token
 */
export function encryptFernet(plaintext, keyBase64) {
  // Convert standard base64/base64url key to Buffer
  const keyBytes = Buffer.from(keyBase64, 'base64');
  if (keyBytes.length !== 32) {
    throw new Error('Fernet key must be 32 bytes base64-encoded');
  }

  // Fernet keys consist of:
  // - 16 bytes signing key (HMAC)
  // - 16 bytes encryption key (AES)
  const signingKey = keyBytes.subarray(0, 16);
  const encryptKey = keyBytes.subarray(16, 32);

  // 1. Version header (1 byte: 0x80)
  const version = Buffer.from([0x80]);

  // 2. Timestamp (8 bytes: big-endian 64-bit integer representing seconds since epoch)
  const timestamp = Buffer.alloc(8);
  const nowSeconds = Math.floor(Date.now() / 1000);
  timestamp.writeBigUInt64BE(BigInt(nowSeconds));

  // 3. IV (16 bytes: randomly generated)
  const iv = crypto.randomBytes(16);

  // 4. Ciphertext (AES-128-CBC encryption of plaintext)
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptKey, iv);
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);

  // 5. Basic token concatenation (version + timestamp + iv + ciphertext)
  const basicToken = Buffer.concat([version, timestamp, iv, ciphertext]);

  // 6. Signature (HMAC-SHA256 of the basic token using the signing key)
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(basicToken);
  const signature = hmac.digest();

  // 7. Assemble final token (basicToken + signature)
  const finalToken = Buffer.concat([basicToken, signature]);

  // Fernet specifies urlsafe base64 encoding (RFC 4648 Section 5)
  // which replaces '+' with '-' and '/' with '_', keeping trailing '=' padding
  const base64String = finalToken.toString('base64');
  return base64String.replace(/\+/g, '-').replace(/\//g, '_');
}
