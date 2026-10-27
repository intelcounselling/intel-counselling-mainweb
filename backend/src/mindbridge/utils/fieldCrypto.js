// Field-level encryption for the school portal's most sensitive data (DPDP Act:
// reasonable security safeguards). AES-256-GCM with a key derived from ENCRYPTION_KEY,
// the same secret the main site uses. Old plaintext rows stay readable.
const crypto = require('crypto');

let key;
function getKey() {
  if (key) return key;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') throw new Error('ENCRYPTION_KEY must be set in production');
    return null; // local dev without a key: store as before
  }
  key = crypto.createHash('sha256').update('mindbridge-fields:' + raw).digest();
  return key;
}

function seal(plain) {
  const k = getKey();
  if (!k) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') };
}

function open({ iv, tag, data }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}

// JSON columns (answers): stored as { __enc: 'v1', iv, tag, data }
function encryptJson(value) {
  if (value === undefined || value === null || (value && value.__enc)) return value;
  const sealed = seal(JSON.stringify(value));
  return sealed ? { __enc: 'v1', ...sealed } : value;
}
function decryptJson(value) {
  if (!value || value.__enc !== 'v1') return value;
  try { return JSON.parse(open(value)); } catch { return null; }
}

// Text columns (notes): stored as "enc:v1:<iv>:<tag>:<data>"
function encryptText(value) {
  if (typeof value !== 'string' || !value || value.startsWith('enc:v1:')) return value;
  const s = seal(value);
  return s ? `enc:v1:${s.iv}:${s.tag}:${s.data}` : value;
}
function decryptText(value) {
  if (typeof value !== 'string' || !value.startsWith('enc:v1:')) return value;
  const [, , iv, tag, data] = value.split(':');
  try { return open({ iv, tag, data }); } catch { return null; }
}

module.exports = { encryptJson, decryptJson, encryptText, decryptText };
