import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits

function getKey() {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    // Refuse to encrypt real data with a key that lives in git history.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable must be set in production');
    }
    console.warn('WARNING: ENCRYPTION_KEY not set — using insecure dev-only fallback key');
    return crypto.createHash('sha256').update('intel_counselling_default_dev_key_32b!').digest();
  }
  // Ensure key is exactly 32 bytes using SHA-256 hash of the provided key
  return crypto.createHash('sha256').update(rawKey).digest();
}

// New data is encrypted with AES-256-GCM (authenticated — tampering is detected).
// Format: "v2:<authTagHex>:<cipherHex>", with the IV kept in the existing iv column.
// Legacy AES-CBC rows (no "v2:" prefix) remain readable.
export function encrypt(plainText) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    encrypted: `v2:${tag}:${encrypted}`,
    iv: iv.toString('hex')
  };
}

export function decrypt(encryptedText, ivHex) {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');

  if (encryptedText.startsWith('v2:')) {
    const [, tagHex, cipherHex] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Legacy AES-256-CBC
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
