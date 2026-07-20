import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits

function getKey() {
  const rawKey = process.env.ENCRYPTION_KEY || 'intel_counselling_default_dev_key_32b!';
  // Ensure key is exactly 32 bytes using SHA-256 hash of the provided key
  return crypto.createHash('sha256').update(rawKey).digest();
}

export function encrypt(plainText) {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

export function decrypt(encryptedText, ivHex) {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
